/**
 * Account bar and feed status strip.
 *
 * The status strip is load-bearing rather than decoration: it states whether
 * the numbers below it are live marks or the bundled snapshot, and when they
 * were last refreshed. A portfolio screen that cannot say how fresh it is
 * cannot be audited.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, mono, spacing, type } from '../theme';
import { clockTime } from '../lib/format';
import { ACCOUNT } from '../data/ledger';
import { Pill } from './primitives';

export const TopBar = ({ subtitle }: { subtitle: string }) => (
  <View style={styles.topBar}>
    <View style={styles.accountBlock}>
      <View style={styles.accountRow}>
        <Text style={styles.accountId}>{ACCOUNT.id}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
      </View>
      <Text style={styles.accountTitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
    <View style={styles.actions}>
      <Ionicons name="search" size={19} color={colors.textSecondary} />
      <Ionicons name="notifications-outline" size={19} color={colors.textSecondary} />
      <Ionicons name="person-circle-outline" size={21} color={colors.textSecondary} />
    </View>
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
    <Pill label={live ? 'Live' : 'Snapshot'} tone={live ? 'live' : 'stale'} />
    <Text style={styles.stripText}>
      {live
        ? 'Real-time marks'
        : staleCount > 0
          ? `${staleCount} symbol${staleCount === 1 ? '' : 's'} on last close`
          : 'Last close'}
    </Text>
    <View style={styles.stripRight}>
      <Text style={styles.stripClock}>{clockTime(lastUpdated)}</Text>
      {refreshing ? (
        <ActivityIndicator size="small" color={colors.textTertiary} />
      ) : (
        <Ionicons name="refresh" size={13} color={colors.textTertiary} />
      )}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  accountBlock: { flex: 1 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accountId: { ...type.body, color: colors.text, fontSize: 15, fontWeight: '700' },
  accountTitle: { fontSize: 10, color: colors.textTertiary, marginTop: 1, letterSpacing: 0.6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  stripText: { fontSize: 10, color: colors.textSecondary, flex: 1 },
  stripRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripClock: { fontFamily: mono, fontSize: 10, color: colors.textTertiary },
});
