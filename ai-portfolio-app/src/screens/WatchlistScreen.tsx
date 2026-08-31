/**
 * Quote monitor for the held names. Same feed as the portfolio screen,
 * presented the way a watchlist is: identity, a sparkline of the path since
 * entry, the last price, and a solid change chip.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, pnlColor, spacing, tabular } from '../theme';
import { price as fmtPrice, signedPct } from '../lib/format';
import { Card, Divider, PctChip } from '../components/primitives';
import { AccountCard } from '../components/TopBar';
import { Sparkline } from '../components/Sparkline';
import { instrumentFor } from '../data/instruments';
import type { ValuedPosition } from '../lib/portfolio';
import type { MarketData } from '../hooks/useMarketData';

type WatchSort = { key: 'price' | 'chg'; dir: 1 | -1 };

export const WatchlistScreen = ({
  data,
  query,
  onSelect,
}: {
  data: MarketData;
  query: string;
  onSelect: (symbol: string) => void;
}) => {
  const { portfolio, feed, refreshing, refresh } = data;
  const { summary } = portfolio;
  const [sort, setSort] = useState<WatchSort>({ key: 'chg', dir: -1 });

  const rows = useMemo(() => {
    let out = portfolio.positions;
    const needle = query.trim().toUpperCase();
    if (needle) {
      out = out.filter(
        (p) =>
          p.symbol.includes(needle) ||
          instrumentFor(p.symbol).name.toUpperCase().includes(needle),
      );
    }
    const get = (p: ValuedPosition) => (sort.key === 'price' ? p.price : p.dayChangePct);
    return [...out].sort((a, b) => sort.dir * (get(a) - get(b)));
  }, [portfolio.positions, query, sort]);

  const onSort = (key: WatchSort['key']) =>
    setSort((current) =>
      current.key === key ? { key, dir: (current.dir * -1) as 1 | -1 } : { key, dir: -1 },
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textSecondary} />
      }
    >
      <Card>
        <AccountCard
          headline={summary.securitiesValue}
          headlineLabel="US Assets · USD"
          dayPnl={summary.dayPnl}
          dayPnlPct={summary.dayPnlPct}
        />
      </Card>

      <View style={styles.toolbar}>
        <View style={{ flex: 1 }} />
        {(['price', 'chg'] as const).map((key) => {
          const active = sort.key === key;
          return (
            <Pressable key={key} onPress={() => onSort(key)} style={styles.sortBtn}>
              <Text style={[styles.sortText, active && styles.sortActive]}>
                {key === 'price' ? 'Price' : '% Chg'}
              </Text>
              <Text style={[styles.caret, active && styles.sortActive]}>
                {active ? (sort.dir < 0 ? '▼' : '▲') : '⇅'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card flush>
        {rows.map((position, index) => {
          const dayTone = pnlColor(position.dayChange);
          const instrument = instrumentFor(position.symbol);
          return (
            <View key={position.symbol}>
              <Pressable
                onPress={() => onSelect(position.symbol)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.identity}>
                  <Text style={styles.name} numberOfLines={1}>
                    {instrument.name}
                  </Text>
                  <Text style={styles.ticker}>{position.symbol}</Text>
                </View>

                <Sparkline
                  symbol={position.symbol}
                  quotes={feed.quotes}
                  direction={position.unrealizedPnl}
                />

                <View style={styles.priceCol}>
                  <Text style={[styles.price, { color: dayTone }, tabular]}>
                    {fmtPrice(position.price)}
                  </Text>
                  <Text style={[styles.prev, tabular]}>{fmtPrice(position.previousClose)}</Text>
                </View>

                <View>
                  <PctChip
                    value={position.dayChange}
                    text={signedPct(position.dayChangePct)}
                  />
                  <Text style={[styles.total, tabular]}>
                    {signedPct(position.unrealizedPct, 1)} total
                  </Text>
                </View>
              </Pressable>
              {index < rows.length - 1 ? <Divider inset={spacing.lg} /> : null}
            </View>
          );
        })}
      </Card>

      <Text style={styles.note}>
        Sparklines trace each holding from its first purchase to the current mark, interpolated
        between the prices the account actually transacted at.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 10,
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sortText: { fontSize: 12, color: colors.textSecondary },
  sortActive: { color: colors.brand },
  caret: { fontSize: 9, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12, gap: 10 },
  rowPressed: { backgroundColor: colors.cardRaised },
  identity: { flex: 1.9, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  ticker: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },
  priceCol: { flex: 1.1, alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: '600' },
  prev: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },
  total: { fontSize: 12, color: colors.textTertiary, marginTop: 3, textAlign: 'right' },
  note: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
