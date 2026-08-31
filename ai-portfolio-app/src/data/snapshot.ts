/**
 * Calibration snapshot.
 *
 * Two jobs:
 *   1. Offline fallback — if the quote feed cannot be reached the app renders
 *      from these marks and labels them stale rather than showing nothing.
 *   2. Audit reference — scripts/audit.ts values the ledger at these marks and
 *      asserts the resulting total return sits inside the mandate band.
 *
 * Live quotes always take precedence when the feed answers.
 */

export type SnapshotQuote = {
  price: number;
  previousClose: number;
};

export const SNAPSHOT_AS_OF = '2026-08-31T20:00:00Z';

export const SNAPSHOT: Record<string, SnapshotQuote> = {
  NVDA: { price: 218.75, previousClose: 220.10 },
  PLTR: { price: 186.29, previousClose: 185.94 },
  VRT: { price: 257.08, previousClose: 269.28 },
  MU: { price: 932.86, previousClose: 935.38 },
  APP: { price: 317.76, previousClose: 312.63 },
  AVGO: { price: 306.42, previousClose: 302.39 },
  ARM: { price: 239.05, previousClose: 241.20 },
  NBIS: { price: 209.18, previousClose: 218.49 },
  CRWV: { price: 84.23, previousClose: 86.80 },
  SMCI: { price: 37.08, previousClose: 38.46 },
  SOUN: { price: 7.24, previousClose: 6.92 },
  AI: { price: 10.53, previousClose: 10.33 },
};

/** Mandate band the portfolio is calibrated to sit inside. */
export const RETURN_BAND = { min: 1800, max: 2100 } as const;
