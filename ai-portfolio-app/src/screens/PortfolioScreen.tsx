/**
 * The portfolio screen: the account card, a sector filter, the headline return
 * over the equity curve, and the holdings blotter.
 *
 * Every figure is derived from the ledger at render time. Nothing here is a
 * stored total, so a price tick moves the position line, the sector totals and
 * the headline number in the same pass and they cannot disagree.
 */

import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, pnlColor, radius, spacing, tabular, type } from '../theme';
import { money, signedMoney, signedPct, shortDate, pct, wholeMoney } from '../lib/format';
import {
  Card,
  ChipRow,
  Divider,
  Label,
  SectionHeader,
  StatCell,
} from '../components/primitives';
import { PositionHeader, PositionRow, Sort, SortKey } from '../components/PositionRow';
import { AllocationBar } from '../components/AllocationBar';
import { ChartCaption, PerformanceChart } from '../components/PerformanceChart';
import { AccountCard } from '../components/TopBar';
import { instrumentFor } from '../data/instruments';
import { INITIAL_CAPITAL } from '../data/ledger';
import { RETURN_BAND } from '../data/snapshot';
import { checkInvariants, ValuedPosition } from '../lib/portfolio';
import type { MarketData } from '../hooks/useMarketData';

const SORTERS: Record<SortKey, (p: ValuedPosition) => number | string> = {
  sym: (p) => p.symbol,
  mv: (p) => p.marketValue,
  price: (p) => p.price,
  day: (p) => p.dayPnl,
};

export const PortfolioScreen = ({
  data,
  query,
  onSelect,
}: {
  data: MarketData;
  query: string;
  onSelect: (symbol: string) => void;
}) => {
  const { portfolio, curve, refreshing, refresh } = data;
  const { positions, summary } = portfolio;

  const [sector, setSector] = useState('All');
  const [sort, setSort] = useState<Sort>({ key: 'mv', dir: -1 });

  const sectors = useMemo(() => {
    const out = ['All'];
    for (const position of positions) {
      const name = instrumentFor(position.symbol).sector;
      if (!out.includes(name)) out.push(name);
    }
    return out;
  }, [positions]);

  const rows = useMemo(() => {
    let out = positions;
    if (sector !== 'All') {
      out = out.filter((p) => instrumentFor(p.symbol).sector === sector);
    }
    const needle = query.trim().toUpperCase();
    if (needle) {
      out = out.filter(
        (p) =>
          p.symbol.includes(needle) ||
          instrumentFor(p.symbol).name.toUpperCase().includes(needle),
      );
    }
    const get = SORTERS[sort.key];
    return [...out].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (typeof x === 'string' && typeof y === 'string') return sort.dir * x.localeCompare(y);
      return sort.dir * ((x as number) - (y as number));
    });
  }, [positions, sector, query, sort]);

  const themes = useMemo(() => {
    const totals = new Map<string, number>();
    for (const position of positions) {
      const name = instrumentFor(position.symbol).sector;
      totals.set(name, (totals.get(name) ?? 0) + position.marketValue);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [positions]);

  // Computed, not asserted: the same identities the Audit tab runs, so this
  // cannot claim "reconciled" while something is off.
  const reconciled = useMemo(() => checkInvariants(portfolio).every((i) => i.passed), [portfolio]);

  const onSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: (current.dir * -1) as 1 | -1 }
        : { key, dir: key === 'sym' ? 1 : -1 },
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textSecondary} />
      }
    >
      <View style={styles.allAccounts}>
        <Text style={styles.allAccountsText}>All Accounts (1)</Text>
        <Text style={styles.caret}>▾</Text>
      </View>

      <Card>
        <AccountCard
          headline={summary.netLiquidation}
          headlineLabel="Total Assets · USD"
          dayPnl={summary.dayPnl}
          dayPnlPct={summary.dayPnlPct}
        />
      </Card>

      <ChipRow options={sectors} value={sector} onChange={setSector} />

      {/* Return, curve and the summary trio share one card; the chart is
          full-bleed between two padded blocks. */}
      <Card flush>
        <View style={styles.pad}>
          <View style={styles.split}>
            <View style={{ flexShrink: 1 }}>
              <Label>Total Return · since inception</Label>
              <Text style={[styles.hero, { color: pnlColor(summary.totalPnl) }, tabular]}>
                {signedPct(summary.totalReturnPct)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Label>Growth</Label>
              <Text style={[styles.mid, tabular]}>{summary.growth.toFixed(2)}x</Text>
              <Text style={styles.cagr}>{pct(summary.cagrPct, 1)} CAGR</Text>
            </View>
          </View>
        </View>

        <PerformanceChart curve={curve} />

        <View style={[styles.pad, { paddingTop: 0 }]}>
          <ChartCaption curve={curve} />
          <Divider />
          <View style={styles.trio}>
            <StatCell label="Cost Basis" value={money(summary.openCostBasis)} />
            <StatCell
              label="Realised P/L"
              value={signedMoney(summary.realizedPnl)}
              color={pnlColor(summary.realizedPnl)}
              align="center"
            />
            <StatCell
              label="Reconciled"
              value={reconciled ? 'Yes' : 'No'}
              color={reconciled ? colors.gain : colors.loss}
              align="right"
              dotted
            />
          </View>
        </View>
      </Card>

      <SectionHeader title="Holdings" aside={`${rows.length} of ${positions.length}`} />
      <Card flush>
        <PositionHeader sort={sort} onSort={onSort} />
        <Divider />
        {rows.length === 0 ? (
          <Text style={styles.empty}>No holdings match this filter.</Text>
        ) : (
          rows.map((position, index) => (
            <View key={position.symbol}>
              <PositionRow position={position} onPress={onSelect} />
              {index < rows.length - 1 ? <Divider inset={spacing.lg} /> : null}
            </View>
          ))
        )}
      </Card>

      <Card flush>
        <View style={styles.cashRow}>
          <Text style={styles.cashLabel}>USD Cash</Text>
          <Text style={[styles.cashValue, tabular]}>{money(summary.cash)}</Text>
        </View>
        <Divider />
        <View style={styles.cashRow}>
          <Text style={[styles.cashLabel, styles.cashStrong]}>Net Assets</Text>
          <Text style={[styles.cashValue, styles.cashStrong, tabular]}>
            {money(summary.netLiquidation)}
          </Text>
        </View>
      </Card>

      <SectionHeader title="Allocation" aside={`${positions.length} positions`} />
      <Card>
        <AllocationBar positions={positions} cashWeight={summary.cash / summary.netLiquidation} />
      </Card>

      <SectionHeader title="By theme" />
      <Card flush>
        {themes.map(([name, value], index) => (
          <View key={name}>
            <View style={styles.themeRow}>
              <Text style={styles.themeName}>{name}</Text>
              <Text style={[styles.themeWeight, tabular]}>
                {pct((value / summary.netLiquidation) * 100, 1)}
              </Text>
              <Text style={[styles.themeValue, tabular]}>{money(value)}</Text>
            </View>
            {index < themes.length - 1 ? <Divider inset={spacing.lg} /> : null}
          </View>
        ))}
      </Card>

      <Text style={styles.note}>
        Funded {shortDate(summary.asOfInception)} with a single {wholeMoney(INITIAL_CAPITAL)} USD
        deposit. No money added or withdrawn since. Target range {RETURN_BAND.min}%–
        {RETURN_BAND.max}%.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  allAccounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  allAccountsText: { fontSize: 17, fontWeight: '700', color: colors.text },
  caret: { fontSize: 11, color: colors.textSecondary },
  pad: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  split: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  hero: { ...type.hero, marginTop: 2 },
  mid: { ...type.mid, color: colors.text },
  cagr: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },
  trio: { flexDirection: 'row', paddingTop: 14, paddingBottom: 2, gap: spacing.md },
  empty: { color: colors.textTertiary, fontSize: 12, padding: 20 },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 13, paddingHorizontal: spacing.lg },
  cashLabel: { fontSize: 14, color: colors.textSecondary },
  cashValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  cashStrong: { color: colors.text, fontWeight: '700' },
  themeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 11, gap: spacing.sm },
  themeName: { flex: 1, fontSize: 13, color: colors.textSecondary },
  themeWeight: { fontSize: 13, fontWeight: '600', color: colors.text, width: 56, textAlign: 'right' },
  themeValue: { fontSize: 13, color: colors.textSecondary, width: 96, textAlign: 'right' },
  note: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
