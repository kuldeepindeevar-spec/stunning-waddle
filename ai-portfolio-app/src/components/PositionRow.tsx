/**
 * One line of the positions blotter.
 *
 * Layout mirrors a broker positions screen: identity on the left, last price
 * and day move in the middle, market value and unrealised P&L on the right.
 * Everything numeric is tabular so the columns hold still as prices tick.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, price as fmtPrice, shares, signedMoney, signedPct } from '../lib/format';
import { instrumentFor } from '../data/instruments';
import type { ValuedPosition } from '../lib/portfolio';

type Props = {
  position: ValuedPosition;
  onPress: (symbol: string) => void;
  /** Show the per-row stale mark. Suppressed when the whole feed is down. */
  showStaleFlag?: boolean;
};

export const PositionRow = ({ position, onPress, showStaleFlag = true }: Props) => {
  const instrument = instrumentFor(position.symbol);
  const dayColor = pnlColor(position.dayChange);
  const pnlTone = pnlColor(position.unrealizedPnl);

  return (
    <Pressable
      onPress={() => onPress(position.symbol)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.identity}>
        <View style={styles.symbolLine}>
          <Text style={styles.symbol}>{position.symbol}</Text>
          {position.stale && showStaleFlag ? <View style={styles.staleDot} /> : null}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {instrument.name}
        </Text>
        <Text style={styles.qty}>
          {shares(position.quantity)} @ {fmtPrice(position.averageCost)}
        </Text>
      </View>

      <View style={styles.quote}>
        <Text style={[styles.last, { color: dayColor }]}>{fmtPrice(position.price)}</Text>
        <Text style={[styles.dayPct, { color: dayColor }]}>
          {signedPct(position.dayChangePct)}
        </Text>
      </View>

      <View style={styles.value}>
        <Text style={styles.mktValue}>{money(position.marketValue)}</Text>
        <Text style={[styles.pnl, { color: pnlTone }]}>{signedMoney(position.unrealizedPnl)}</Text>
        <Text style={[styles.pnlPct, { color: pnlTone }]}>
          {signedPct(position.unrealizedPct)}
        </Text>
      </View>
    </Pressable>
  );
};

/** Column captions above the blotter. */
export const PositionHeader = () => (
  <View style={styles.headerRow}>
    <Text style={[styles.headerText, styles.identity]}>Symbol / Position</Text>
    <Text style={[styles.headerText, styles.quote, styles.headerRight]}>Last</Text>
    <Text style={[styles.headerText, styles.value, styles.headerRight]}>Value / Unreal P&L</Text>
  </View>
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  headerText: {
    ...type.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  headerRight: { textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    backgroundColor: colors.background,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  identity: { flex: 3.1 },
  quote: { flex: 1.9, alignItems: 'flex-end' },
  value: { flex: 2.8, alignItems: 'flex-end' },
  symbolLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  symbol: { ...type.body, fontSize: 15, color: colors.text, fontWeight: '700' },
  staleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  name: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  qty: { fontFamily: mono, fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  last: { fontFamily: mono, fontSize: 14, fontWeight: '600' },
  dayPct: { fontFamily: mono, fontSize: 11, marginTop: 3 },
  mktValue: { fontFamily: mono, fontSize: 14, fontWeight: '600', color: colors.text },
  pnl: { fontFamily: mono, fontSize: 11, marginTop: 3 },
  pnlPct: { fontFamily: mono, fontSize: 10, marginTop: 1 },
});
