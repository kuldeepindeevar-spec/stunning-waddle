/**
 * Re-centring the book inside the mandate band.
 *
 * The market moves; a book calibrated to the middle of the band drifts out of
 * it eventually. The only lever that can move a 20x portfolio far enough is
 * how concentrated the opening deposit was in its best performer, so that is
 * what this exposes — a single dial over the inception allocation:
 *
 *   lambda > 0  shift dollars from the other inception buys into the anchor
 *   lambda = 0  the ledger exactly as written
 *   lambda < 0  deploy less of the deposit and leave the rest in cash
 *
 * The two halves are deliberately different. Above zero the account is already
 * fully invested, so the only way up is concentration. Below zero, spreading
 * the anchor's dollars across the other names barely helps because they are
 * all large winners too — the lever with real downward range is simply putting
 * less of the deposit to work, which parks it at 1x.
 *
 * The rest of the ledger follows that dial rather than ignoring it: a trim of
 * "16% of the line" stays 16% of a resized line, and the later buys, which are
 * funded out of the account's own proceeds, shrink when those proceeds shrink.
 * The dates, the prices and the strategy are untouched — it is the same
 * history executed at a different concentration. The opening deposit is still
 * $100,000 and total spend never rises, so the account cannot go overdrawn.
 */

import { TRADES, Trade } from '../data/ledger';
import { buildPortfolio, replayLedger, QuoteMap } from './portfolio';

/** The opening deployment: every buy on or before the tranche-2 date. */
const INCEPTION_CUTOFF = '2022-10-31';

export const INCEPTION_TRADES = TRADES.filter(
  (trade) => trade.date <= INCEPTION_CUTOFF && trade.side === 'BUY',
);
const LATER_TRADES = TRADES.filter((trade) => trade.date > INCEPTION_CUTOFF);

export type Band = { min: number; max: number };

export type Calibration = {
  lambda: number;
  /** Ledger id -> the quantity change, for ids that actually move. */
  changes: Record<string, { from: number; to: number; symbol: string }>;
  returnPct: number;
  feasible: boolean;
};

export const applyQuantities = (overrides: Record<string, number>): Trade[] =>
  TRADES.map((trade) =>
    overrides[trade.id] !== undefined ? { ...trade, quantity: overrides[trade.id] } : trade,
  );

/**
 * Total return for a candidate sizing, or null when the sizing is invalid —
 * an overdrawn account, or a sell exceeding the shares held on that date.
 */
export function returnForSizing(
  overrides: Record<string, number>,
  quotes: QuoteMap,
): number | null {
  const trades = applyQuantities(overrides);
  try {
    if (replayLedger(trades).minimumCash < -1e-9) return null;
    return buildPortfolio(quotes, { trades }).summary.totalReturnPct;
  } catch {
    return null;
  }
}

/** The inception symbol with the highest return on cost — the anchor. */
export function anchorSymbol(quotes: QuoteMap): string {
  let best = '';
  let bestMultiple = -Infinity;
  for (const trade of INCEPTION_TRADES) {
    const quote = quotes[trade.symbol];
    if (!quote) continue;
    const multiple = quote.price / trade.price;
    if (multiple > bestMultiple) {
      bestMultiple = multiple;
      best = trade.symbol;
    }
  }
  return best;
}

/** Inception quantities for a given concentration setting. */
function inceptionSizing(lambda: number, anchor: string): Record<string, number> {
  const overrides: Record<string, number> = {};

  const anchorDollars = INCEPTION_TRADES.filter((t) => t.symbol === anchor).reduce(
    (sum, t) => sum + t.quantity * t.price,
    0,
  );
  const otherDollars = INCEPTION_TRADES.filter((t) => t.symbol !== anchor).reduce(
    (sum, t) => sum + t.quantity * t.price,
    0,
  );

  for (const trade of INCEPTION_TRADES) {
    const base = trade.quantity * trade.price;
    let dollars: number;

    if (lambda < 0) {
      // Deploy less of the deposit; the remainder sits in cash at 1x.
      dollars = base * (1 + lambda);
    } else {
      // Concentrate into the anchor. Both sides move pro rata by their share
      // of their own pot — the anchor is bought across two tranches and the
      // other names across eight, so the moved dollars have to be split within
      // each side rather than applied to every row in full. Total inception
      // spend is therefore unchanged.
      const moved = lambda * otherDollars;
      dollars =
        trade.symbol === anchor
          ? anchorDollars > 0
            ? base + moved * (base / anchorDollars)
            : base
          : otherDollars > 0
            ? base - moved * (base / otherDollars)
            : base;
    }
    overrides[trade.id] = Math.max(0, Math.floor(dollars / trade.price));
  }
  return overrides;
}

/**
 * A complete, feasible sizing for a concentration setting.
 *
 * Later sells scale with the line they trim. Later buys are then scaled by the
 * largest factor up to 1.0 that keeps cash non-negative throughout — the
 * account can only ever deploy proceeds it actually has.
 */
export function sizingForLambda(lambda: number, anchor: string): Record<string, number> {
  const overrides = inceptionSizing(lambda, anchor);

  // How each symbol's opening line was resized.
  const originalBySymbol = new Map<string, number>();
  const resizedBySymbol = new Map<string, number>();
  for (const trade of INCEPTION_TRADES) {
    originalBySymbol.set(trade.symbol, (originalBySymbol.get(trade.symbol) ?? 0) + trade.quantity);
    resizedBySymbol.set(
      trade.symbol,
      (resizedBySymbol.get(trade.symbol) ?? 0) + overrides[trade.id],
    );
  }

  for (const trade of LATER_TRADES) {
    if (trade.side !== 'SELL') continue;
    const before = originalBySymbol.get(trade.symbol);
    const after = resizedBySymbol.get(trade.symbol);
    if (!before || after === undefined) continue;
    overrides[trade.id] = Math.max(0, Math.floor(trade.quantity * (after / before)));
  }

  const laterBuys = LATER_TRADES.filter((trade) => trade.side === 'BUY');
  const withBuyScale = (scale: number): Record<string, number> => {
    const next = { ...overrides };
    for (const trade of laterBuys) {
      next[trade.id] = Math.max(0, Math.floor(trade.quantity * scale));
    }
    return next;
  };

  const solvent = (scale: number): boolean => {
    try {
      return replayLedger(applyQuantities(withBuyScale(scale))).minimumCash >= -1e-9;
    } catch {
      return false;
    }
  };

  if (solvent(1)) return withBuyScale(1);

  // Largest affordable scale.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (solvent(mid)) lo = mid;
    else hi = mid;
  }
  return withBuyScale(lo);
}

/**
 * Scan the concentration dial for the setting closest to the band midpoint.
 * Rounding to whole shares makes the response very slightly non-monotone, so a
 * fine sweep is used rather than a bisection — the space is one-dimensional
 * and each evaluation is a 21-row replay, so this is milliseconds of work.
 */
export function solveBallast(quotes: QuoteMap, band: Band): Calibration {
  const target = (band.min + band.max) / 2;
  const anchor = anchorSymbol(quotes);

  const asWritten = returnForSizing({}, quotes) ?? Number.NaN;
  let best: Calibration = {
    lambda: 0,
    changes: {},
    returnPct: asWritten,
    feasible: Number.isFinite(asWritten) && asWritten >= band.min && asWritten <= band.max,
  };
  let bestError = Number.isFinite(asWritten)
    ? Math.abs(asWritten - target)
    : Number.POSITIVE_INFINITY;

  const STEPS = 1200;
  for (let i = 0; i <= STEPS; i += 1) {
    const lambda = -1 + (2 * i) / STEPS;
    const overrides = sizingForLambda(lambda, anchor);
    const result = returnForSizing(overrides, quotes);
    if (result == null) continue;
    const error = Math.abs(result - target);
    if (error < bestError - 1e-12) {
      bestError = error;
      const changes: Calibration['changes'] = {};
      for (const [id, qty] of Object.entries(overrides)) {
        const original = TRADES.find((t) => t.id === id);
        if (original && original.quantity !== qty) {
          changes[id] = { from: original.quantity, to: qty, symbol: original.symbol };
        }
      }
      best = {
        lambda,
        changes,
        returnPct: result,
        feasible: result >= band.min && result <= band.max,
      };
    }
  }
  return best;
}

/** Scale every quote by a factor — used to test the solver against a moved market. */
export function scaleQuotes(quotes: QuoteMap, factor: number): QuoteMap {
  return Object.fromEntries(
    Object.entries(quotes).map(([symbol, quote]) => [
      symbol,
      { price: quote.price * factor, previousClose: quote.previousClose * factor },
    ]),
  );
}
