/**
 * One line of the holdings blotter, and its sortable column header.
 *
 * Four columns, each a value over a grey sub-value: identity, market value
 * over quantity, last price over average cost, and today's P&L over the
 * since-entry return. Everything numeric is tabular so the columns hold still
 * as prices tick.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, pnlColor, spacing, tabular, type } from '../theme';
import { money, price as fmtPrice, shares, signedMoney, signedPct } from '../lib/format';
import { instrumentFor } from '../data/instruments';
import type { ValuedPosition } from '../lib/portfolio';

export type SortKey = 'sym' | 'mv' | 'price' | 'day';
export type Sort = { key: SortKey; dir: 1 | -1 };

const COLUMNS: { key: SortKey; label: string; flex: number; align: 'left' | 'right' }[] = [
  { key: 'sym', label: 'Symbol', flex: 2.6, align: 'left' },
  { key: 'mv', label: 'MV/Qty', flex: 2.1, align: 'right' },
  { key: 'price', label: 'Price/Cost', flex: 2.0, align: 'right' },
  { key: 'day', label: 'Today’s P/L', flex: 2.1, align: 'right' },
];

/** Sortable column captions. Tapping the active column reverses it. */
export const PositionHeader = ({
  sort,
  onSort,
}: {
  sort: Sort;
  onSort: (key: SortKey) => void;
}) => (
  <View style={styles.headerRow}>
    {COLUMNS.map((column) => {
      const active = sort.key === column.key;
      return (
        <Pressable
          key={column.key}
          onPress={() => onSort(column.key)}
          style={{
            flex: column.flex,
            flexDirection: 'row',
            gap: 3,
            alignItems: 'center',
            justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          <Text style={[styles.headerText, active && styles.headerActive]}>{column.label}</Text>
          <Text style={[styles.caret, active && styles.headerActive]}>
            {active ? (sort.dir < 0 ? '▼' : '▲') : '⇅'}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const PositionRow = ({
  position,
  onPress,
}: {
  position: ValuedPosition;
  onPress: (symbol: string) => void;
}) => {
  const instrument = instrumentFor(position.symbol);
  const dayTone = pnlColor(position.dayPnl);
  const totalTone = pnlColor(position.unrealizedPnl);

  return (
    <Pressable
      onPress={() => onPress(position.symbol)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={{ flex: 2.6, minWidth: 0 }}>
        <Text style={styles.primary} numberOfLines={1}>
          {instrument.name}
        </Text>
        <Text style={styles.secondary}>{position.symbol}</Text>
      </View>

      <View style={{ flex: 2.1, alignItems: 'flex-end' }}>
        <Text style={[styles.primary, tabular]}>{money(position.marketValue)}</Text>
        <Text style={[styles.secondary, tabular]}>{shares(position.quantity)}</Text>
      </View>

      <View style={{ flex: 2.0, alignItems: 'flex-end' }}>
        <Text style={[styles.primary, tabular]}>{fmtPrice(position.price)}</Text>
        <Text style={[styles.secondary, tabular]}>{fmtPrice(position.averageCost)}</Text>
      </View>

      <View style={{ flex: 2.1, alignItems: 'flex-end' }}>
        <Text style={[styles.primary, { color: dayTone }, tabular]}>
          {signedMoney(position.dayPnl)}
        </Text>
        <Text style={[styles.secondary, { color: totalTone }, tabular]}>
          {signedPct(position.unrealizedPct)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  headerText: { ...type.label, color: colors.textSecondary },
  headerActive: { color: colors.brand },
  caret: { fontSize: 9, color: colors.textSecondary, opacity: 0.85 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    gap: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.cardRaised },
  primary: { ...type.rowPrimary, color: colors.text },
  secondary: { ...type.sub, color: colors.textTertiary, marginTop: 3 },
});
