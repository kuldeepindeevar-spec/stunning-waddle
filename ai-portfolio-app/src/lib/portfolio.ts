/**
 * Portfolio engine.
 *
 * Replays the trade ledger to produce positions, cash and realised P&L, then
 * values the result against a quote map. Every figure the UI shows comes from
 * here, so the invariants are stated as functions the audit script can call.
 *
 * Cost basis uses the average-cost method, which is what IBKR reports by
 * default for a US cash/margin account.
 */

import { INCEPTION_DATE, INITIAL_CAPITAL, TRADES, Trade } from '../data/ledger';

export type Quote = {
  price: number;
  previousClose: number;
};

export type QuoteMap = Record<string, Quote>;

/** A symbol's state after the whole ledger has been replayed. */
export type Lot = {
  symbol: string;
  quantity: number;
  /** Total remaining cost basis in USD. */
  costBasis: number;
  /** costBasis / quantity. Zero for a fully closed line. */
  averageCost: number;
  realizedPnl: number;
  firstBuyDate: string;
  lastTradeDate: string;
  tradeCount: number;
};

export type ReplayResult = {
  lots: Lot[];
  /** Settled cash after every trade. */
  cash: number;
  realizedPnl: number;
  /** Lowest cash balance seen at any point — must never go below zero. */
  minimumCash: number;
};

export type ValuedPosition = Lot & {
  price: number;
  previousClose: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPct: number;
  dayPnl: number;
  dayChange: number;
  dayChangePct: number;
  /** Share of net liquidation value, 0..1. */
  weight: number;
  /** Whether this line is priced from a live quote or the offline snapshot. */
  stale: boolean;
};

export type PortfolioSummary = {
  asOfInception: string;
  initialCapital: number;
  netLiquidation: number;
  securitiesValue: number;
  cash: number;
  /** Cost basis of currently held shares only. */
  openCostBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  totalReturnPct: number;
  dayPnl: number;
  dayPnlPct: number;
  yearsHeld: number;
  cagrPct: number;
  winners: number;
  losers: number;
};

export type Portfolio = {
  positions: ValuedPosition[];
  summary: PortfolioSummary;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Replay the ledger. Trades are sorted by date then by ledger order so the
 * result does not depend on how the source file happens to be arranged.
 */
export function replayLedger(trades: Trade[] = TRADES): ReplayResult {
  const ordered = [...trades].sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  );

  const bySymbol = new Map<string, Lot>();
  let cash = INITIAL_CAPITAL;
  let minimumCash = cash;
  let realizedPnl = 0;

  for (const trade of ordered) {
    const gross = trade.quantity * trade.price;
    let lot = bySymbol.get(trade.symbol);

    if (!lot) {
      lot = {
        symbol: trade.symbol,
        quantity: 0,
        costBasis: 0,
        averageCost: 0,
        realizedPnl: 0,
        firstBuyDate: trade.date,
        lastTradeDate: trade.date,
        tradeCount: 0,
      };
      bySymbol.set(trade.symbol, lot);
    }

    if (trade.side === 'BUY') {
      lot.quantity += trade.quantity;
      lot.costBasis += gross;
      cash -= gross;
    } else {
      if (trade.quantity > lot.quantity) {
        throw new Error(
          `${trade.id}: cannot sell ${trade.quantity} ${trade.symbol}, only ${lot.quantity} held`,
        );
      }
      // Average cost: the sold shares carry the line's blended basis.
      const basisOut = lot.averageCost * trade.quantity;
      const gain = gross - basisOut;
      lot.quantity -= trade.quantity;
      lot.costBasis -= basisOut;
      lot.realizedPnl += gain;
      realizedPnl += gain;
      cash += gross;
    }

    lot.averageCost = lot.quantity > 0 ? lot.costBasis / lot.quantity : 0;
    lot.lastTradeDate = trade.date;
    lot.tradeCount += 1;
    minimumCash = Math.min(minimumCash, cash);
  }

  return {
    lots: [...bySymbol.values()],
    cash,
    realizedPnl,
    minimumCash,
  };
}

/** Value the replayed ledger against a quote map. */
export function buildPortfolio(
  quotes: QuoteMap,
  opts: { staleSymbols?: Set<string>; asOf?: Date; trades?: Trade[] } = {},
): Portfolio {
  const { lots, cash, realizedPnl } = replayLedger(opts.trades);
  const open = lots.filter((lot) => lot.quantity > 0);

  const priced = open.map((lot) => {
    const quote = quotes[lot.symbol];
    if (!quote) {
      throw new Error(`no quote available for ${lot.symbol}`);
    }
    const marketValue = lot.quantity * quote.price;
    const unrealizedPnl = marketValue - lot.costBasis;
    const dayChange = quote.price - quote.previousClose;
    return {
      ...lot,
      price: quote.price,
      previousClose: quote.previousClose,
      marketValue,
      unrealizedPnl,
      unrealizedPct: lot.costBasis > 0 ? (unrealizedPnl / lot.costBasis) * 100 : 0,
      dayPnl: dayChange * lot.quantity,
      dayChange,
      dayChangePct: quote.previousClose > 0 ? (dayChange / quote.previousClose) * 100 : 0,
      weight: 0,
      stale: opts.staleSymbols?.has(lot.symbol) ?? false,
    };
  });

  const securitiesValue = priced.reduce((sum, p) => sum + p.marketValue, 0);
  const netLiquidation = securitiesValue + cash;

  // Weights are a share of net liquidation value, so cash is part of the
  // denominator and the position weights deliberately sum to slightly under 1.
  for (const position of priced) {
    position.weight = netLiquidation > 0 ? position.marketValue / netLiquidation : 0;
  }
  priced.sort((a, b) => b.marketValue - a.marketValue);

  const openCostBasis = priced.reduce((sum, p) => sum + p.costBasis, 0);
  const unrealizedPnl = securitiesValue - openCostBasis;
  const totalPnl = netLiquidation - INITIAL_CAPITAL;
  const dayPnl = priced.reduce((sum, p) => sum + p.dayPnl, 0);
  const previousNetLiquidation = netLiquidation - dayPnl;

  const asOf = opts.asOf ?? new Date();
  const yearsHeld =
    (asOf.getTime() - new Date(`${INCEPTION_DATE}T00:00:00Z`).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  const growth = netLiquidation / INITIAL_CAPITAL;

  return {
    positions: priced,
    summary: {
      asOfInception: INCEPTION_DATE,
      initialCapital: INITIAL_CAPITAL,
      netLiquidation,
      securitiesValue,
      cash,
      openCostBasis,
      unrealizedPnl,
      realizedPnl,
      totalPnl,
      totalReturnPct: (totalPnl / INITIAL_CAPITAL) * 100,
      dayPnl,
      dayPnlPct: previousNetLiquidation > 0 ? (dayPnl / previousNetLiquidation) * 100 : 0,
      yearsHeld,
      cagrPct: yearsHeld > 0 ? (Math.pow(growth, 1 / yearsHeld) - 1) * 100 : 0,
      winners: priced.filter((p) => p.unrealizedPnl > 0).length,
      losers: priced.filter((p) => p.unrealizedPnl < 0).length,
    },
  };
}

/**
 * The accounting identities the whole app rests on. Returned as data rather
 * than thrown so the in-app Audit screen and the CLI audit can share them.
 */
export type Invariant = {
  name: string;
  detail: string;
  expected: number;
  actual: number;
  tolerance: number;
  passed: boolean;
};

export function checkInvariants(portfolio: Portfolio, trades?: Trade[]): Invariant[] {
  const { positions, summary } = portfolio;
  const replay = replayLedger(trades);
  const tol = 0.01;

  const make = (
    name: string,
    detail: string,
    expected: number,
    actual: number,
    tolerance = tol,
  ): Invariant => ({
    name,
    detail,
    expected,
    actual,
    tolerance,
    passed: Math.abs(expected - actual) <= tolerance,
  });

  const sumOf = (fn: (p: (typeof positions)[number]) => number) =>
    positions.reduce((total, p) => total + fn(p), 0);

  return [
    make(
      'Sources and uses',
      'Open cost basis + settled cash must equal the opening deposit plus realised P&L. ' +
        'Nothing enters or leaves the account except the original $100,000.',
      INITIAL_CAPITAL + summary.realizedPnl,
      summary.openCostBasis + summary.cash,
    ),
    make(
      'Net liquidation value',
      'NLV must equal the sum of position market values plus settled cash.',
      sumOf((p) => p.marketValue) + summary.cash,
      summary.netLiquidation,
    ),
    make(
      'Position market value',
      'Every line must satisfy quantity x last price = market value.',
      sumOf((p) => p.quantity * p.price),
      sumOf((p) => p.marketValue),
    ),
    make(
      'Unrealised P&L',
      'Unrealised P&L must equal market value less remaining cost basis.',
      sumOf((p) => p.marketValue - p.costBasis),
      summary.unrealizedPnl,
    ),
    make(
      'Total P&L decomposition',
      'Realised plus unrealised P&L must equal net liquidation value less the deposit.',
      summary.realizedPnl + summary.unrealizedPnl,
      summary.totalPnl,
    ),
    make(
      'Total return',
      'Total return % must equal total P&L divided by the opening deposit.',
      (summary.totalPnl / INITIAL_CAPITAL) * 100,
      summary.totalReturnPct,
      1e-9,
    ),
    make(
      'Weights',
      'Position weights plus the cash weight must sum to 100% of NLV.',
      1,
      sumOf((p) => p.weight) + summary.cash / summary.netLiquidation,
      1e-9,
    ),
    make(
      'Day P&L',
      'Day P&L must equal the sum of (last - previous close) x quantity.',
      sumOf((p) => (p.price - p.previousClose) * p.quantity),
      summary.dayPnl,
    ),
    make(
      'Cash never negative',
      'The account is never overdrawn on any date in the ledger — no leverage is used.',
      0,
      Math.min(0, replay.minimumCash),
    ),
    make(
      'Average cost',
      'Each line satisfies average cost x quantity = remaining cost basis.',
      sumOf((p) => round2(p.averageCost * p.quantity)),
      sumOf((p) => round2(p.costBasis)),
      positions.length * 0.01,
    ),
  ];
}
