/**
 * Weight-by-position stacked bar. Twelve slices in a donut would be unreadable
 * on a phone; a single stacked bar with a ranked legend reads at a glance and
 * keeps the ordering identical to the blotter above it.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, mono, spacing, type } from '../theme';
import { pct } from '../lib/format';
import type { ValuedPosition } from '../lib/portfolio';

/**
 * Sequential ramp rather than a categorical palette: the slices are ordered by
 * weight, so a ramp encodes the ordering instead of fighting it.
 */
const RAMP = [
  '#2f6fd0', '#3d8bfd', '#5b9ffd', '#77b0fb', '#93c1fa',
  '#a9cdf8', '#bcd8f7', '#cbe0f6', '#d8e7f5', '#e2ecf5',
  '#eaf1f7', '#f1f5f9',
];

export const AllocationBar = ({
  positions,
  cashWeight,
}: {
  positions: ValuedPosition[];
  cashWeight: number;
}) => (
  <View style={styles.wrap}>
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
          <Text style={styles.legendWeight}>{pct(position.weight * 100, 1)}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 2,
    overflow: 'hidden',
    gap: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '31%',
  },
  swatch: { width: 7, height: 7, borderRadius: 1 },
  legendSymbol: { ...type.micro, color: colors.textSecondary, flex: 1 },
  legendWeight: { fontFamily: mono, fontSize: 10, color: colors.textTertiary },
});
