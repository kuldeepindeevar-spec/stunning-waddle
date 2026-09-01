/**
 * Weight-by-position stacked bar. Twelve slices in a donut would be unreadable
 * on a phone; a single stacked bar with a ranked legend reads at a glance and
 * keeps the ordering identical to the blotter above it.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, tabular } from '../theme';
import { pct } from '../lib/format';
import type { ValuedPosition } from '../lib/portfolio';

/**
 * A warm sequential ramp off the accent rather than a categorical palette: the
 * slices are ordered by weight, so a ramp encodes that ordering instead of
 * fighting it.
 */
const RAMP = [
  '#ff7a00', '#ff8d24', '#ff9f42', '#ffb15f', '#ffc07c', '#ffcd96',
  '#ffd8ac', '#ffe1bf', '#ffe8ce', '#ffeeda', '#fff3e4', '#fff7ee',
];

export const AllocationBar = ({
  positions,
  cashWeight,
}: {
  positions: ValuedPosition[];
  cashWeight: number;
}) => (
  <View>
    <View style={styles.bar}>
      {positions.map((position, index) => (
        <View
          key={position.symbol}
          style={{
            flex: Math.max(position.weight, 0.0008),
            backgroundColor: RAMP[index % RAMP.length],
          }}
        />
      ))}
      {cashWeight > 0 ? (
        <View style={{ flex: Math.max(cashWeight, 0.0008), backgroundColor: colors.divider }} />
      ) : null}
    </View>

    <View style={styles.legend}>
      {positions.map((position, index) => (
        <View key={position.symbol} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: RAMP[index % RAMP.length] }]} />
          <Text style={styles.legendSymbol}>{position.symbol}</Text>
          <Text style={[styles.legendWeight, tabular]}>{pct(position.weight * 100, 1)}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 10, borderRadius: 3, overflow: 'hidden', gap: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '30%' },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  legendSymbol: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, flex: 1 },
  legendWeight: { fontSize: 11, color: colors.textTertiary },
});
