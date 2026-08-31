/**
 * Design tokens.
 *
 * A committed single-theme dark world: rounded cards on pure black, one warm
 * accent, and green/red reserved exclusively for P&L sign. Every colour is
 * declared here and painted explicitly — nothing inherits a host background.
 */

import { Platform } from 'react-native';

export const colors = {
  background: '#000000',
  card: '#1a1a1c',
  cardRaised: '#242528',
  chip: '#1f2023',
  chipActive: '#3a2410',
  divider: '#26272b',
  tabBar: '#0a0a0b',

  text: '#ffffff',
  textSecondary: '#9ba0a8',
  textTertiary: '#6d727a',

  /** The single accent. Never used to mean good or bad. */
  brand: '#ff7a00',
  brandSoft: 'rgba(255,122,0,0.14)',
  accountMark: '#2b7fff',

  gain: '#00c46a',
  loss: '#f4485c',
  flat: '#9ba0a8',
  /** Solid chip fills — the loudest element in a list. */
  gainFill: '#00b761',
  lossFill: '#e5384c',
  gainWash: 'rgba(0,196,106,0.14)',
  lossWash: 'rgba(244,72,92,0.14)',
  brandWash: 'rgba(255,122,0,0.14)',

  chartLine: '#ff7a00',
  chartFillTop: 'rgba(255,122,0,0.30)',
  chartFillBottom: 'rgba(255,122,0,0)',
  grid: '#1e1f23',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 14,
  chip: 9,
  pill: 5,
  control: 10,
} as const;

/**
 * Figures are set in the UI face, not a monospace one, and aligned with
 * tabular figures instead — columns hold still as prices tick while the
 * numbers still read like the rest of the interface.
 */
export const tabular = Platform.select({
  ios: { fontVariant: ['tabular-nums' as const] },
  android: { fontVariant: ['tabular-nums' as const] },
  default: { fontVariant: ['tabular-nums' as const] },
}) as { fontVariant: ('tabular-nums')[] };

export const type = {
  screenTitle: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  hero: { fontSize: 30, fontWeight: '600' as const, letterSpacing: -0.8 },
  mid: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  section: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  rowPrimary: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '400' as const },
  sub: { fontSize: 12, fontWeight: '400' as const },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4 },
} as const;

/** Green for a gain, red for a loss, grey for exactly flat. */
export const pnlColor = (value: number): string =>
  value > 0 ? colors.gain : value < 0 ? colors.loss : colors.flat;
