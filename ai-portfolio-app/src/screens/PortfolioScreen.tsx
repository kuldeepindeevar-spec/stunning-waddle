/**
 * The portfolio screen: net liquidation value, day move, since-inception
 * return, the equity curve, allocation, and the positions blotter.
 *
 * Every figure is derived from the ledger at render time. Nothing here is a
 * stored total, so a price tick moves the position line, the sector totals and
 * the headline number in the same pass and they cannot disagree.
 */

import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, signedMoney, signedPct, shortDate, pct, wholeMoney } from '../lib/format';
import { Divider, SectionHeader, StatCell } from '../components/primitives';
import { PositionHeader, PositionRow } from '../components/PositionRow';
import { AllocationBar } from '../components/AllocationBar';
import { ChartFooter, PerformanceChart } from '../components/PerformanceChart';
import { instrumentFor } from '../data/instruments';
import { INITIAL_CAPITAL } from '../data/ledger';
import { RETURN_BAND } from '../data/snapshot';
import type { MarketData } from '../hooks/useMarketData';

export const PortfolioScreen = ({
  data,
  onSelect,
}: {
  data: MarketData;
  onSelect: (symbol: string) => void;
}) => {
  const { portfolio, curve, feed, refreshing, refresh } = data;
  const { positions, summary } = portfolio;
  const dayTone = pnlColor(summary.dayPnl);
  const partiallyStale = feed.staleSymbols.size > 0 && feed.staleSymbols.size < positions.length;

  const sectors = useMemo(() => {
    const totals = new Map<string, number>();
    for (const position of positions) {
      const sector = instrumentFor(position.symbol).sector;
      totals.set(sector, (totals.get(sector) ?? 0) + position.marketValue);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [positions]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.textSecondary}
        />
      }
    >
      {/* ---------------------------------------------------- headline */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Net Liquidation Value · USD</Text>
        <Text style={styles.heroValue}>{money(summary.netLiquidation)}</Text>
        <View style={styles.heroRow}>
          <Text style={[styles.heroDelta, { color: dayTone }]}>
            {signedMoney(summary.dayPnl)}
          </Text>
          <Text style={[styles.heroDelta, { color: dayTone }]}>
            {signedPct(summary.dayPnlPct)}
          </Text>
          <Text style={styles.heroDeltaLabel}>Today</Text>
        </View>
      </View>

      {/* ------------------------------------------------ return banner */}
      <View style={styles.returnBanner}>
        <View style={styles.returnMain}>
          <Text style={styles.returnLabel}>Total return since inception</Text>
          <Text style={styles.returnValue}>{signedPct(summary.totalReturnPct)}</Text>
        </View>
        <View style={styles.returnSide}>
          <Text style={styles.returnSideValue}>
            {(summary.netLiquidation / INITIAL_CAPITAL).toFixed(2)}x
          </Text>
          <Text style={styles.returnSideLabel}>
            {pct(summary.cagrPct, 1)} CAGR · {summary.yearsHeld.toFixed(1)} yrs
          </Text>
        </View>
      </View>

      <PerformanceChart curve={curve} />
      <ChartFooter curve={curve} />

      {/* ---------------------------------------------------- P&L grid */}
      <SectionHeader title="Profit & Loss" />
      <Divider />
      <View style={styles.grid}>
        <StatCell label="Deposit" value={money(summary.initialCapital)} />
        <StatCell
          label="Realised"
          value={signedMoney(summary.realizedPnl)}
          color={pnlColor(summary.realizedPnl)}
          align="right"
        />
      </View>
      <View style={styles.grid}>
        <StatCell label="Open cost basis" value={money(summary.openCostBasis)} />
        <StatCell
          label="Unrealised"
          value={signedMoney(summary.unrealizedPnl)}
          color={pnlColor(summary.unrealizedPnl)}
          align="right"
        />
      </View>
      <View style={styles.grid}>
        <StatCell label="Settled cash" value={money(summary.cash)} />
        <StatCell
          label="Total P&L"
          value={signedMoney(summary.totalPnl)}
          color={pnlColor(summary.totalPnl)}
          align="right"
        />
      </View>
      <Divider />
      <Text style={styles.gridNote}>
        Funded {shortDate(summary.asOfInception)} with a single {wholeMoney(INITIAL_CAPITAL)} USD
        deposit. No money added or withdrawn since. Mandate band {RETURN_BAND.min}%–
        {RETURN_BAND.max}%.
      </Text>

      {/* ------------------------------------------------- allocation */}
      <SectionHeader
        title="Allocation"
        right={<Text style={styles.sectionAside}>{positions.length} positions</Text>}
      />
      <AllocationBar
        positions={positions}
        cashWeight={summary.cash / summary.netLiquidation}
      />

      <SectionHeader title="By theme" />
      <Divider />
      {sectors.map(([sector, value]) => (
        <View key={sector}>
          <View style={styles.sectorRow}>
            <Text style={styles.sectorName}>{sector}</Text>
            <Text style={styles.sectorWeight}>
              {pct((value / summary.netLiquidation) * 100, 1)}
            </Text>
            <Text style={styles.sectorValue}>{money(value)}</Text>
          </View>
          <Divider inset={spacing.lg} />
        </View>
      ))}

      {/* -------------------------------------------------- positions */}
      <SectionHeader
        title="Positions"
        right={
          <Text style={styles.sectionAside}>
            {summary.winners} up · {summary.losers} down
          </Text>
        }
      />
      <PositionHeader />
      <Divider />
      {positions.map((position) => (
        <View key={position.symbol}>
          <PositionRow
            position={position}
            onPress={onSelect}
            // A per-row staleness dot is only informative when *some* lines are
            // stale. When the whole feed is down the status strip says so, and
            // a dot on all twelve rows is noise.
            showStaleFlag={partiallyStale}
          />
          <Divider inset={spacing.lg} />
        </View>
      ))}

      <View style={styles.cashRow}>
        <Text style={styles.cashLabel}>USD Cash</Text>
        <Text style={styles.cashValue}>{money(summary.cash)}</Text>
      </View>
      <Divider />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{money(summary.netLiquidation)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  heroLabel: {
    ...type.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  heroValue: {
    ...type.hero,
    fontFamily: mono,
    color: colors.text,
    marginTop: 2,
  },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 4 },
  heroDelta: { fontFamily: mono, fontSize: 14, fontWeight: '600' },
  heroDeltaLabel: { fontSize: 11, color: colors.textTertiary },
  returnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: colors.gain,
  },
  returnMain: { flex: 1 },
  returnLabel: { ...type.micro, color: colors.textTertiary, textTransform: 'uppercase' },
  returnValue: {
    fontFamily: mono,
    fontSize: 26,
    fontWeight: '700',
    color: colors.gain,
    marginTop: 2,
  },
  returnSide: { alignItems: 'flex-end' },
  returnSideValue: { fontFamily: mono, fontSize: 20, fontWeight: '600', color: colors.text },
  returnSideLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 3 },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.lg,
  },
  gridNote: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textTertiary,
  },
  sectionAside: { fontSize: 10, color: colors.textTertiary, fontFamily: mono },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  sectorName: { flex: 1, fontSize: 12, color: colors.textSecondary },
  sectorWeight: {
    fontFamily: mono,
    fontSize: 12,
    color: colors.text,
    width: 56,
    textAlign: 'right',
  },
  sectorValue: {
    fontFamily: mono,
    fontSize: 12,
    color: colors.textSecondary,
    width: 96,
    textAlign: 'right',
  },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cashLabel: { fontSize: 13, color: colors.textSecondary },
  cashValue: { fontFamily: mono, fontSize: 13, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  totalLabel: { ...type.body, color: colors.text, fontWeight: '700' },
  totalValue: { fontFamily: mono, fontSize: 15, fontWeight: '700', color: colors.text },
});
