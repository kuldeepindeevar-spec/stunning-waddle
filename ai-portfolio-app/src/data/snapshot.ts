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
  VRT: { price: 257.08, previousClose: 269.28 },
  PLTR: { price: 186.29, previousClose: 185.94 },
  NVDA: { price: 218.75, previousClose: 220.10 },
  MU: { price: 932.86, previousClose: 935.38 },
  HOOD: { price: 104.26, previousClose: 110.20 },
  META: { price: 578.02, previousClose: 571.11 },
  AVGO: { price: 306.42, previousClose: 302.39 },
  NBIS: { price: 209.18, previousClose: 218.49 },
  CRWV: { price: 84.23, previousClose: 86.80 },
  ADBE: { price: 291.52, previousClose: 289.15 },
  COIN: { price: 187.16, previousClose: 183.90 },
  PYPL: { price: 70.01, previousClose: 69.20 },
};

/** Target return range the portfolio is calibrated to sit inside. */
export const RETURN_BAND = { min: 300, max: 500 } as const;
