/** Bottom navigation. Four destinations, the accent reserved for the active one. */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, type } from '../theme';

export type TabKey = 'portfolio' | 'watchlist' | 'activity' | 'audit';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'portfolio', label: 'Portfolio', icon: 'pie-chart' },
  { key: 'watchlist', label: 'Watchlist', icon: 'stats-chart' },
  { key: 'activity', label: 'Activity', icon: 'swap-horizontal' },
  { key: 'audit', label: 'Audit', icon: 'shield-checkmark' },
];

export const TabBar = ({
  active,
  onChange,
  bottomInset,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  bottomInset: number;
}) => (
  <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
    {TABS.map((tab) => {
      const selected = tab.key === active;
      const tint = selected ? colors.text : colors.textTertiary;
      return (
        <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
          {selected ? <View style={styles.activeMark} /> : null}
          <Ionicons name={tab.icon} size={19} color={tint} />
          <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dividerStrong,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  activeMark: {
    position: 'absolute',
    top: -spacing.sm,
    height: 2,
    width: 30,
    backgroundColor: colors.accent,
  },
  label: { ...type.micro, fontSize: 9 },
});
