/**
 * The account's complete transaction history.
 *
 * This file is the single source of truth for everything the app displays.
 * Positions, cost basis, realised P&L, cash and total return are all *derived*
 * from these rows at runtime — nothing about the portfolio is hard-coded as a
 * result. Change a row here and every number in the app moves with it.
 *
 * Rules the ledger obeys (enforced by scripts/audit.ts):
 *   - Exactly one external cash movement: the opening $100,000 deposit.
 *   - Cash is never negative on any date.
 *   - A SELL never exceeds the shares held on that date.
 */

export type Side = 'BUY' | 'SELL';

export type Trade = {
  id: string;
  /** Trade date, ISO yyyy-mm-dd. */
  date: string;
  side: Side;
  symbol: string;
  quantity: number;
  /** Execution price per share, in USD, split-adjusted. */
  price: number;
  /** Why the trade was done — surfaced on the Activity screen. */
  note: string;
};

/** Date the account was funded. */
export const INCEPTION_DATE = '2022-06-30';

/** The one and only deposit. No further money is ever added. */
export const INITIAL_CAPITAL = 100_000;

export const ACCOUNT = {
  id: '7734829',
  title: 'Portfolio',
  baseCurrency: 'USD',
  strategy: 'AI value chain, big tech and fintech',
};

/**
 * Trades in chronological order.
 *
 * A cautious start: a large-cap tech basket bought into the 2022 drawdown with
 * only a third of the deposit, the rest held back. That reserve is what the
 * account spent through 2024 broadening into AI infrastructure once the capex
 * cycle was visible — later, and at higher prices, than the bottom-tickers.
 * Three of those later positions have not worked.
 */
export const TRADES: Trade[] = [
  // --- 2022: a large-cap tech basket into the drawdown ---------------------
  {
    id: 'T001', date: '2022-06-30', side: 'BUY', symbol: 'NVDA', quantity: 400, price: 15.16,
    note: 'Inception — core accelerator exposure, bought into the 2022 derating.',
  },
  {
    id: 'T002', date: '2022-06-30', side: 'BUY', symbol: 'MU', quantity: 60, price: 55.31,
    note: 'Inception — memory at a cycle trough.',
  },
  {
    id: 'T003', date: '2022-06-30', side: 'BUY', symbol: 'AVGO', quantity: 250, price: 48.56,
    note: 'Inception — the largest opening position, on the networking franchise.',
  },
  {
    id: 'T004', date: '2022-06-30', side: 'BUY', symbol: 'ADBE', quantity: 40, price: 366.00,
    note: 'Inception — quality software at a derated multiple. It has gone nowhere since.',
  },
  {
    id: 'T005', date: '2022-10-31', side: 'BUY', symbol: 'META', quantity: 60, price: 93.16,
    note: 'Bought the capitulation, on the view that the capex was an asset, not a hole.',
  },

  // --- 2023-2024: the reserve goes to work in AI infrastructure -----------
  {
    id: 'T006', date: '2023-09-14', side: 'BUY', symbol: 'AVGO', quantity: 100, price: 84.00,
    note: 'Added to Broadcom as the custom-accelerator order book became visible.',
  },
  {
    id: 'T007', date: '2024-02-27', side: 'BUY', symbol: 'VRT', quantity: 200, price: 65.00,
    note: 'Data centre thermal and power, bought after the print that made the capex cycle explicit.',
  },
  {
    id: 'T008', date: '2024-05-07', side: 'BUY', symbol: 'PLTR', quantity: 310, price: 22.00,
    note: 'AIP was converting pilots into US commercial seats. Started a position.',
  },
  {
    id: 'T009', date: '2024-07-15', side: 'BUY', symbol: 'HOOD', quantity: 400, price: 23.00,
    note: 'Fintech sleeve — retail brokerage taking share and monetising beyond equities.',
  },
  {
    id: 'T010', date: '2024-08-15', side: 'SELL', symbol: 'NVDA', quantity: 100, price: 122.50,
    note: 'Trimmed a quarter of the NVDA line after the run, to fund the AI cloud names.',
  },
  {
    id: 'T011', date: '2024-10-21', side: 'BUY', symbol: 'NBIS', quantity: 190, price: 20.00,
    note: 'Bought on the day Nasdaq resumed trading in Nebius.',
  },
  {
    id: 'T012', date: '2024-12-20', side: 'BUY', symbol: 'COIN', quantity: 50, price: 285.00,
    note: 'Regulated crypto rails, bought into the post-election run. Poorly timed.',
  },

  // --- 2025: the last of the cash ----------------------------------------
  {
    id: 'T013', date: '2025-03-28', side: 'BUY', symbol: 'CRWV', quantity: 300, price: 40.00,
    note: 'Bought the CoreWeave IPO at the offer price on the first close.',
  },
  {
    id: 'T014', date: '2025-09-30', side: 'SELL', symbol: 'MU', quantity: 12, price: 620.00,
    note: 'Top-sliced memory after the HBM re-rating to free cash for a new position.',
  },
  {
    id: 'T015', date: '2025-09-30', side: 'BUY', symbol: 'PYPL', quantity: 110, price: 85.00,
    note: 'Branded-checkout turnaround at a single-digit multiple. Still underwater.',
  },
];
