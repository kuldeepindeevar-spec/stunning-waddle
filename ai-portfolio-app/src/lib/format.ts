/** Number and date formatting shared across every screen. */

const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * 2,056,836.18 — no currency glyph. A single-currency blotter states the
 * currency once in the header; repeating a $ on every figure only adds noise
 * and makes columns of numbers harder to scan.
 */
export const money = (value: number): string => usdFormatter.format(value);

/** +1,956,836.18 / -6,876.00 — the same figure with an explicit sign. */
export const signedMoney = (value: number): string =>
  `${value < 0 ? '-' : '+'}${usdFormatter.format(Math.abs(value))}`;

export const wholeMoney = (value: number): string => compactFormatter.format(value);

export const signedPct = (value: number, digits = 2): string =>
  `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(digits)}%`;

export const pct = (value: number, digits = 2): string => `${value.toFixed(digits)}%`;

export const shares = (value: number): string => compactFormatter.format(value);

/** 218.75 — prices always carry two decimals, sub-dollar names get four. */
export const price = (value: number): string =>
  value < 1 ? value.toFixed(4) : usdFormatter.format(value);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 30 Jun 2022 */
export const shortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** Jun '22 — axis labels. */
export const axisDate = (t: number): string => {
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
};

/** 14:32:07 — the quote timestamp in the status strip. */
export const clockTime = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds(),
  ).padStart(2, '0')}`;
