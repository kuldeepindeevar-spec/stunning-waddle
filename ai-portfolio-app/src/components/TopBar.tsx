/**
 * Screen title bar, the feed status strip, and the account summary card.
 *
 * The status strip is load-bearing rather than decoration: it states whether
 * the numbers below it are live marks or the bundled snapshot, and when they
 * were last refreshed. A portfolio screen that cannot say how fresh it is
 * cannot be audited.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, pnlColor, radius, spacing, tabular, type } from '../theme';
import { clockTime, money, signedMoney, signedPct } from '../lib/format';
import { ACCOUNT } from '../data/ledger';
import { StatusPill } from './primitives';

export const TopBar = ({
  title,
  searchOpen,
  onToggleSearch,
}: {
  title: string;
  searchOpen: boolean;
  onToggleSearch: () => void;
}) => (
  <View style={styles.topBar}>
    <View style={styles.brand}>
      <View style={styles.mark} />
      <Text style={styles.title}>{title}</Text>
    </View>
    <Pressable onPress={onToggleSearch} hitSlop={10}>
      <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
        <Circle
          cx={11}
          cy={11}
          r={7}
          stroke={searchOpen ? colors.brand : colors.textSecondary}
          strokeWidth={2}
        />
        <Path
          d="M20 20l-3.6-3.6"
          stroke={searchOpen ? colors.brand : colors.textSecondary}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  </View>
);

export const StatusStrip = ({
  live,
  staleCount,
  lastUpdated,
  refreshing,
  onRefresh,
}: {
  live: boolean;
  staleCount: number;
  lastUpdated: Date;
  refreshing: boolean;
  onRefresh: () => void;
}) => (
  <Pressable onPress={onRefresh} style={styles.strip}>
    <StatusPill label={live ? 'Live' : 'Snapshot'} tone={live ? 'live' : 'stale'} />
    <Text style={styles.stripText} numberOfLines={1}>
      {live
        ? 'Real-time marks'
        : staleCount > 0
          ? `${staleCount} symbol${staleCount === 1 ? '' : 's'} on last close`
          : 'Last close'}
    </Text>
    <Text style={[styles.stripClock, tabular]}>{clockTime(lastUpdated)}</Text>
    {refreshing ? (
      <ActivityIndicator size="small" color={colors.textTertiary} />
    ) : (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6"
          stroke={colors.textTertiary}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    )}
  </Pressable>
);

/** The account card: identity, headline total and the day's move. */
export const AccountCard = ({
  headline,
  headlineLabel,
  dayPnl,
  dayPnlPct,
}: {
  headline: number;
  headlineLabel: string;
  dayPnl: number;
  dayPnlPct: number;
}) => {
  const tone = pnlColor(dayPnl);
  return (
    <>
      <View style={styles.acctTop}>
        <View style={styles.acctMark} />
        <Text style={styles.acctName} numberOfLines={1}>
          {ACCOUNT.title} ({ACCOUNT.id})
        </Text>
        <Text style={styles.chev}>›</Text>
      </View>
      <View style={styles.split}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.label}>{headlineLabel}</Text>
          <Text style={[styles.hero, tabular]} numberOfLines={1}>
            {money(headline)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Today’s P/L</Text>
          <Text style={[styles.mid, { color: tone }, tabular]}>{signedMoney(dayPnl)}</Text>
          <Text style={[styles.sub, { color: tone }, tabular]}>{signedPct(dayPnlPct)}</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    gap: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 },
  mark: { width: 26, height: 26, borderRadius: 7, backgroundColor: colors.brand },
  title: { ...type.screenTitle, color: colors.text },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 7,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: radius.control,
  },
  stripText: { fontSize: 11, color: colors.textSecondary, flex: 1 },
  stripClock: { fontSize: 11, color: colors.textTertiary },
  acctTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  acctMark: { width: 20, height: 20, borderRadius: 5, backgroundColor: colors.accountMark },
  acctName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  chev: { fontSize: 16, color: colors.textTertiary },
  split: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: spacing.md,
  },
  label: { ...type.label, color: colors.textSecondary },
  hero: { ...type.hero, color: colors.text, marginTop: 2 },
  mid: { ...type.mid },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
