/**
 * Design tokens for the trading-terminal look: near-black ground, hairline
 * dividers, one accent, and green/red reserved exclusively for P&L sign.
 */

import { Platform } from 'react-native';

export const colors = {
  background: '#000000',
  surface: '#0e0f11',
  surfaceRaised: '#16181c',
  surfacePressed: '#1e2126',
  divider: '#22252b',
  dividerStrong: '#2e3238',

  text: '#f2f4f7',
  textSecondary: '#9aa2ad',
  textTertiary: '#6b727d',

  accent: '#d81222',
  accentMuted: '#3a1216',
  info: '#3d8bfd',

  gain: '#00c26e',
  loss: '#ff4d4f',
  flat: '#9aa2ad',

  chartLine: '#3d8bfd',
  chartFillTop: 'rgba(61,139,253,0.28)',
  chartFillBottom: 'rgba(61,139,253,0.0)',
  grid: '#1b1e23',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Tabular figures matter more than the typeface here: columns of numbers have
 * to line up as the last price ticks.
 */
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}) as string;

export const type = {
  hero: { fontSize: 38, fontWeight: '300' as const, letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '600' as const },
  section: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.1 },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodySm: { fontSize: 12, fontWeight: '500' as const },
  micro: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

/** Green for a gain, red for a loss, grey for exactly flat. */
export const pnlColor = (value: number): string =>
  value > 0 ? colors.gain : value < 0 ? colors.loss : colors.flat;
