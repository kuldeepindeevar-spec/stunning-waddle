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
  id: 'U7734829',
  title: 'AI ALPHA — MARGIN',
  baseCurrency: 'USD',
  strategy: 'AI value chain, big tech and fintech',
};

/**
 * Trades in chronological order.
 *
 * Two tranches across the mid-2022 drawdown build the compounding core, then
 * realised gains fund everything after: the semiconductor franchise, the two
 * neoclouds that were not investable at inception, and three large-cap
 * positions bought later that have not worked.
 */
export const TRADES: Trade[] = [
  // --- Tranche 1: initial deployment, 61% of capital ----------------------
  {
    id: 'T001', date: '2022-06-30', side: 'BUY', symbol: 'VRT', quantity: 1720, price: 9.30,
    note: 'Inception tranche 1 — data centre thermal and power at post-derating levels.',
  },
  {
    id: 'T002', date: '2022-06-30', side: 'BUY', symbol: 'PLTR', quantity: 1740, price: 9.20,
    note: 'Inception tranche 1 — software optionality on the model layer.',
  },
  {
    id: 'T003', date: '2022-06-30', side: 'BUY', symbol: 'NVDA', quantity: 990, price: 15.16,
    note: 'Inception tranche 1 — core accelerator exposure.',
  },
  {
    id: 'T004', date: '2022-06-30', side: 'BUY', symbol: 'HOOD', quantity: 700, price: 8.50,
    note: 'Inception tranche 1 — fintech sleeve, bought near the post-IPO low.',
  },
  {
    id: 'T005', date: '2022-06-30', side: 'BUY', symbol: 'MU', quantity: 145, price: 55.31,
    note: 'Inception tranche 1 — memory cycle trough.',
  },

  // --- Tranche 2: reserve deployed into the October 2022 low ---------------
  {
    id: 'T006', date: '2022-10-31', side: 'BUY', symbol: 'VRT', quantity: 1520, price: 9.86,
    note: 'Tranche 2 — averaged in with the reserve.',
  },
  {
    id: 'T007', date: '2022-10-31', side: 'BUY', symbol: 'PLTR', quantity: 1230, price: 8.13,
    note: 'Tranche 2 — averaged in below the tranche 1 entry.',
  },
  {
    id: 'T008', date: '2022-10-31', side: 'BUY', symbol: 'HOOD', quantity: 520, price: 9.60,
    note: 'Tranche 2 — added to the fintech sleeve.',
  },
  {
    id: 'T009', date: '2022-10-31', side: 'BUY', symbol: 'META', quantity: 54, price: 93.16,
    note: 'Tranche 2 — bought the capitulation, on the view that AI capex was an asset.',
  },
  {
    id: 'T010', date: '2022-10-31', side: 'BUY', symbol: 'MU', quantity: 73, price: 54.55,
    note: 'Tranche 2 — topped up memory. Capital fully deployed.',
  },

  // --- Profit-funded rotation ----------------------------------------------
  {
    id: 'T011', date: '2023-09-14', side: 'SELL', symbol: 'NVDA', quantity: 250, price: 45.50,
    note: 'Trimmed 25% of the NVDA line after the first AI re-rating.',
  },
  {
    id: 'T012', date: '2023-09-14', side: 'BUY', symbol: 'AVGO', quantity: 130, price: 84.00,
    note: 'Custom accelerator and AI networking exposure alongside the merchant GPU.',
  },
  {
    id: 'T013', date: '2024-08-15', side: 'SELL', symbol: 'NVDA', quantity: 300, price: 122.50,
    note: 'Second NVDA trim — concentration control after the 2024 run.',
  },
  {
    id: 'T014', date: '2024-08-15', side: 'BUY', symbol: 'ADBE', quantity: 30, price: 550.00,
    note: 'Bought the Firefly generative-AI monetisation thesis. It did not play out.',
  },
  {
    id: 'T015', date: '2024-10-21', side: 'BUY', symbol: 'NBIS', quantity: 925, price: 20.00,
    note: 'Bought on the day Nasdaq resumed trading in Nebius.',
  },
  {
    id: 'T016', date: '2024-12-20', side: 'SELL', symbol: 'PLTR', quantity: 380, price: 76.00,
    note: 'Trimmed 13% of PLTR after the index-inclusion run.',
  },
  {
    id: 'T017', date: '2024-12-20', side: 'BUY', symbol: 'COIN', quantity: 60, price: 285.00,
    note: 'Regulated crypto rails, bought into the post-election run. Poorly timed.',
  },
  {
    id: 'T018', date: '2025-03-28', side: 'BUY', symbol: 'CRWV', quantity: 350, price: 40.00,
    note: 'Bought the CoreWeave IPO at the offer price on the first close.',
  },
  {
    id: 'T019', date: '2025-09-30', side: 'SELL', symbol: 'VRT', quantity: 240, price: 175.00,
    note: 'Trimmed the largest weight after a 19x run.',
  },
  {
    id: 'T020', date: '2025-09-30', side: 'BUY', symbol: 'AVGO', quantity: 60, price: 258.00,
    note: 'Added to Broadcom on the custom-silicon order book.',
  },
  {
    id: 'T021', date: '2025-09-30', side: 'BUY', symbol: 'PYPL', quantity: 80, price: 85.00,
    note: 'Branded-checkout turnaround at a single-digit multiple. Still underwater.',
  },
  {
    id: 'T022', date: '2026-03-16', side: 'BUY', symbol: 'MU', quantity: 28, price: 700.00,
    note: 'Added to memory with the remaining cash as HBM pricing re-rated.',
  },
];
