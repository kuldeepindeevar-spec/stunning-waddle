/**
 * Equity curve construction.
 *
 * Preferred path: pull monthly closes for every symbol and replay the ledger at
 * each month end, so the curve is the account's actual marked net liquidation
 * value over time rather than a drawing.
 *
 * Fallback path: when the history feed is unreachable the curve is modelled by
 * log-linear interpolation between the prices the account actually transacted
 * at and the current mark. That is an approximation and the UI labels it as
 * one — the endpoints are exact, the shape between them is not.
 */

import { INCEPTION_DATE, INITIAL_CAPITAL, TRADES } from '../data/ledger';
import type { QuoteMap } from './portfolio';

const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
const DAY = 24 * 60 * 60 * 1000;

export type CurvePoint = {
  /** Epoch milliseconds at the month end. */
  t: number;
  /** Net liquidation value on that date. */
  value: number;
};

export type EquityCurve = {
  points: CurvePoint[];
  /** 'marked' when built from real closes, 'modelled' when interpolated. */
  basis: 'marked' | 'modelled';
};

export type PriceHistory = Record<string, { t: number; close: number }[]>;

/** Shares held and settled cash as at the end of the given date. */
export function holdingsAsOf(date: number): { shares: Record<string, number>; cash: number } {
  const shares: Record<string, number> = {};
  let cash = INITIAL_CAPITAL;
  for (const trade of TRADES) {
    if (new Date(`${trade.date}T00:00:00Z`).getTime() > date) break;
    const gross = trade.quantity * trade.price;
    if (trade.side === 'BUY') {
      shares[trade.symbol] = (shares[trade.symbol] ?? 0) + trade.quantity;
      cash -= gross;
    } else {
      shares[trade.symbol] = (shares[trade.symbol] ?? 0) - trade.quantity;
      cash += gross;
    }
  }
  return { shares, cash };
}

/**
 * Month-end timestamps from inception to now, plus now itself.
 *
 * Walks year/month as integers rather than mutating a Date — month arithmetic
 * on a Date pinned to a month end normalises in ways that are easy to get
 * wrong (31 March plus one month is not 30 April).
 */
export function monthEnds(now = Date.now()): number[] {
  const start = new Date(`${INCEPTION_DATE}T00:00:00Z`);
  const startMs = start.getTime();
  const out: number[] = [startMs];

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  for (let guard = 0; guard < 1200; guard += 1) {
    // Day 0 of the next month is the last day of this one.
    const end = Date.UTC(year, month + 1, 0);
    if (end >= now) break;
    if (end > startMs) out.push(end);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  out.push(now);
  return out;
}

/** Close at or immediately before `t`, or null if the series starts later. */
function closeAt(series: { t: number; close: number }[], t: number): number | null {
  let found: number | null = null;
  for (const point of series) {
    if (point.t <= t + DAY) found = point.close;
    else break;
  }
  return found;
}

export function buildCurveFromHistory(history: PriceHistory, now = Date.now()): EquityCurve {
  const points: CurvePoint[] = [];
  for (const t of monthEnds(now)) {
    const { shares, cash } = holdingsAsOf(t);
    let value = cash;
    let complete = true;
    for (const [symbol, qty] of Object.entries(shares)) {
      if (qty <= 0) continue;
      const close = closeAt(history[symbol] ?? [], t);
      if (close == null) {
        complete = false;
        break;
      }
      value += qty * close;
    }
    if (complete) points.push({ t, value });
  }
  return { points, basis: 'marked' };
}

/**
 * Modelled curve. Each symbol's price path is interpolated in log space
 * between the prices the ledger transacted at and today's mark.
 */
export function buildModelledCurve(quotes: QuoteMap, now = Date.now()): EquityCurve {
  const anchors: Record<string, { t: number; price: number }[]> = {};
  for (const trade of TRADES) {
    const t = new Date(`${trade.date}T00:00:00Z`).getTime();
    (anchors[trade.symbol] ??= []).push({ t, price: trade.price });
  }
  for (const [symbol, list] of Object.entries(anchors)) {
    const quote = quotes[symbol];
    if (quote) list.push({ t: now, price: quote.price });
    list.sort((a, b) => a.t - b.t);
  }

  const priceAt = (symbol: string, t: number): number | null => {
    const list = anchors[symbol];
    if (!list || list.length === 0) return null;
    if (t <= list[0].t) return list[0].price;
    if (t >= list[list.length - 1].t) return list[list.length - 1].price;
    for (let i = 1; i < list.length; i += 1) {
      const a = list[i - 1];
      const b = list[i];
      if (t <= b.t) {
        const span = b.t - a.t;
        const w = span === 0 ? 1 : (t - a.t) / span;
        return Math.exp(Math.log(a.price) * (1 - w) + Math.log(b.price) * w);
      }
    }
    return list[list.length - 1].price;
  };

  const points: CurvePoint[] = [];
  for (const t of monthEnds(now)) {
    const { shares, cash } = holdingsAsOf(t);
    let value = cash;
    for (const [symbol, qty] of Object.entries(shares)) {
      if (qty <= 0) continue;
      const price = priceAt(symbol, t);
      if (price != null) value += qty * price;
    }
    points.push({ t, value });
  }
  return { points, basis: 'modelled' };
}

/** Monthly closes for the last five years. Returns {} if the feed fails. */
export async function fetchMonthlyHistory(symbols: string[]): Promise<PriceHistory> {
  const history: PriceHistory = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      for (const host of HOSTS) {
        try {
          const response = await fetch(
            `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5y&interval=1mo`,
            { headers: { accept: 'application/json' } },
          );
          if (!response.ok) continue;
          const body = await response.json();
          const result = body?.chart?.result?.[0];
          const stamps: number[] | undefined = result?.timestamp;
          const closes: (number | null)[] | undefined = result?.indicators?.quote?.[0]?.close;
          if (!stamps || !closes) continue;
          const series: { t: number; close: number }[] = [];
          for (let i = 0; i < stamps.length; i += 1) {
            const close = closes[i];
            if (typeof close === 'number' && Number.isFinite(close)) {
              series.push({ t: stamps[i] * 1000, close });
            }
          }
          if (series.length) {
            history[symbol] = series;
            return;
          }
        } catch {
          // Try the next host.
        }
      }
    }),
  );
  return history;
}
