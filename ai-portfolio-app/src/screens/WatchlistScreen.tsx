/**
 * Quote monitor for the held names, sorted by day move. Same feed as the
 * portfolio screen, presented the way a watchlist is: price first, size second.
 */

import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, price as fmtPrice, signedPct, signedMoney } from '../lib/format';
import { Divider, SectionHeader } from '../components/primitives';
import { instrumentFor } from '../data/instruments';
import type { MarketData } from '../hooks/useMarketData';

export const WatchlistScreen = ({ data }: { data: MarketData }) => {
  const { portfolio, refreshing, refresh } = data;
  const rows = [...portfolio.positions].sort((a, b) => b.dayChangePct - a.dayChangePct);
  const advancers = rows.filter((r) => r.dayChange > 0).length;
  const decliners = rows.filter((r) => r.dayChange < 0).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textSecondary} />
      }
    >
      <SectionHeader
        title="AI Value Chain"
        right={
          <Text style={styles.aside}>
            {advancers} up · {decliners} down
          </Text>
        }
      />
      <View style={styles.columns}>
        <Text style={[styles.colHead, { flex: 3 }]}>Symbol</Text>
        <Text style={[styles.colHead, styles.right, { flex: 2 }]}>Last</Text>
        <Text style={[styles.colHead, styles.right, { flex: 2 }]}>Change</Text>
        <Text style={[styles.colHead, styles.right, { flex: 2.4 }]}>Day P&L</Text>
      </View>
      <Divider />
      {rows.map((row) => {
        const tone = pnlColor(row.dayChange);
        return (
          <View key={row.symbol}>
            <View style={styles.row}>
              <View style={{ flex: 3 }}>
                <Text style={styles.symbol}>{row.symbol}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {instrumentFor(row.symbol).name}
                </Text>
              </View>
              <View style={{ flex: 2, alignItems: 'flex-end' }}>
                <Text style={[styles.figure, { color: tone }]}>{fmtPrice(row.price)}</Text>
                <Text style={styles.sub}>prev {fmtPrice(row.previousClose)}</Text>
              </View>
              <View style={{ flex: 2, alignItems: 'flex-end' }}>
                <Text style={[styles.figure, { color: tone }]}>
                  {signedPct(row.dayChangePct)}
                </Text>
                <Text style={[styles.sub, { color: tone }]}>{signedMoney(row.dayChange)}</Text>
              </View>
              <View style={{ flex: 2.4, alignItems: 'flex-end' }}>
                <Text style={[styles.figure, { color: tone }]}>{signedMoney(row.dayPnl)}</Text>
                <Text style={styles.sub}>{money(row.marketValue)}</Text>
              </View>
            </View>
            <Divider inset={spacing.lg} />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  aside: { fontSize: 10, color: colors.textTertiary, fontFamily: mono },
  columns: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  colHead: { ...type.micro, color: colors.textTertiary, textTransform: 'uppercase' },
  right: { textAlign: 'right' },
  row: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: 9 },
  symbol: { ...type.body, fontSize: 14, color: colors.text, fontWeight: '700' },
  name: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  figure: { fontFamily: mono, fontSize: 13, fontWeight: '600' },
  sub: { fontFamily: mono, fontSize: 10, color: colors.textTertiary, marginTop: 3 },
});
