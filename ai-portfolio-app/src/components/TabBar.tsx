/** Bottom navigation. Four destinations, the accent reserved for the active one. */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors, spacing } from '../theme';

export type TabKey = 'portfolio' | 'watchlist' | 'activity' | 'audit';

const ICONS: Record<TabKey, (tint: string) => React.ReactNode> = {
  portfolio: (tint) => (
    <>
      <Rect x={2.5} y={5.5} width={19} height={14} rx={3.5} stroke={tint} strokeWidth={1.7} />
      <Path d="M16 11h4v3h-4a1.5 1.5 0 010-3z" stroke={tint} strokeWidth={1.7} />
    </>
  ),
  watchlist: (tint) => (
    <Path
      d="M12 20s-7.5-4.7-7.5-9.4A4.1 4.1 0 0112 8.3a4.1 4.1 0 017.5 2.3C19.5 15.3 12 20 12 20z"
      stroke={tint}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  ),
  activity: (tint) => (
    <Path
      d="M4 8h13l-3-3M20 16H7l3 3"
      stroke={tint}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  audit: (tint) => (
    <>
      <Path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" stroke={tint} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={tint} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'activity', label: 'Activity' },
  { key: 'audit', label: 'Audit' },
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
  <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, spacing.xs) + 6 }]}>
    {TABS.map((tab) => {
      const selected = tab.key === active;
      const tint = selected ? colors.brand : colors.textTertiary;
      return (
        <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
          <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
            {ICONS[tab.key](tint)}
          </Svg>
          <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44 },
  label: { fontSize: 10, fontWeight: '600' },
});
