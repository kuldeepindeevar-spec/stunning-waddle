/**
 * In-app reconciliation.
 *
 * Runs the same checkInvariants() the CLI audit runs, against the same live
 * marks the portfolio screen is showing. If a number on the portfolio screen
 * is wrong, a row here goes red — the two cannot drift apart because they are
 * the same computation.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, pnlColor, spacing, tabular, type } from '../theme';
import { money, pct, signedMoney, signedPct, shortDate } from '../lib/format';
import { Card, Divider, KeyValue, SectionHeader } from '../components/primitives';
import { radius } from '../theme';
import { checkInvariants } from '../lib/portfolio';
import { INITIAL_CAPITAL, INCEPTION_DATE, TRADES } from '../data/ledger';
import { RETURN_BAND } from '../data/snapshot';
import type { MarketData } from '../hooks/useMarketData';

const Mark = ({ passed, size = 18 }: { passed: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={passed ? colors.gain : colors.loss} strokeWidth={1.5} />
    <Path
      d={passed ? 'M8 12.5l2.5 2.5L16 9.5' : 'M9 9l6 6M15 9l-6 6'}
      stroke={passed ? colors.gain : colors.loss}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const AuditScreen = ({
  data,
  manualCount = 0,
  onReset,
}: {
  data: MarketData;
  manualCount?: number;
  onReset?: () => void;
}) => {
  const { portfolio, feed } = data;
  const { summary, positions } = portfolio;
  const invariants = checkInvariants(portfolio);
  const allPassed = invariants.every((i) => i.passed);

  const inBand =
    summary.totalReturnPct >= RETURN_BAND.min && summary.totalReturnPct <= RETURN_BAND.max;
  const bandFloor = INITIAL_CAPITAL * (1 + RETURN_BAND.min / 100);
  const bandCeiling = INITIAL_CAPITAL * (1 + RETURN_BAND.max / 100);
  const downside = ((bandFloor - summary.netLiquidation) / summary.netLiquidation) * 100;
  const upside = ((bandCeiling - summary.netLiquidation) / summary.netLiquidation) * 100;

  const lo = RETURN_BAND.min - (RETURN_BAND.max - RETURN_BAND.min) * 0.35;
  const hi = RETURN_BAND.max + (RETURN_BAND.max - RETURN_BAND.min) * 0.35;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const marker = clamp((summary.totalReturnPct - lo) / (hi - lo));
  const bandStart = clamp((RETURN_BAND.min - lo) / (hi - lo));
  const bandEnd = clamp((RETURN_BAND.max - lo) / (hi - lo));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Card>
        <View style={styles.verdict}>
          <Mark passed={allPassed} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verdictTitle}>
              {allPassed ? 'Reconciled' : 'Reconciliation failed'}
            </Text>
            <Text style={styles.verdictBody}>
              {invariants.filter((i) => i.passed).length} of {invariants.length} balance checks
              pass against {feed.live ? 'live' : 'snapshot'} marks.
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="How your return is calculated" />
      <Card>
        <KeyValue label="Opening deposit" value={money(INITIAL_CAPITAL)} />
        <KeyValue label="Securities at last price" value={money(summary.securitiesValue)} />
        <KeyValue label="Settled cash" value={money(summary.cash)} />
        <Divider />
        <KeyValue label="Net liquidation value" value={money(summary.netLiquidation)} strong />
        <KeyValue label="less opening deposit" value={`(${money(INITIAL_CAPITAL)})`} />
        <Divider />
        <KeyValue
          label="Total P&L"
          value={signedMoney(summary.totalPnl)}
          color={pnlColor(summary.totalPnl)}
          strong
        />
        <KeyValue
          label={`÷ ${money(INITIAL_CAPITAL)} deposit`}
          value={signedPct(summary.totalReturnPct)}
          color={pnlColor(summary.totalPnl)}
          strong
        />
      </Card>

      <SectionHeader title="Target range" />
      <Card>
        <KeyValue label="Target" value={`${RETURN_BAND.min}% – ${RETURN_BAND.max}%`} />
        <KeyValue
          label="Actual"
          value={signedPct(summary.totalReturnPct)}
          color={inBand ? colors.gain : colors.loss}
        />
        <View style={styles.meter}>
          <View style={styles.meterTrack} />
          <View
            style={[
              styles.meterBand,
              { left: `${bandStart * 100}%`, width: `${(bandEnd - bandStart) * 100}%` },
            ]}
          />
          <View style={[styles.meterMark, { left: `${marker * 100}%` }]} />
        </View>
        <Text style={styles.note}>
          Marks move with the market, so the target is a calibration and not a guarantee. From
          here the account can fall {Math.abs(downside).toFixed(1)}% before it drops below{' '}
          {RETURN_BAND.min}%, or rise {upside.toFixed(1)}% before it exceeds {RETURN_BAND.max}%.
        </Text>
      </Card>

      <SectionHeader
        title="Reconciliation"
        aside={`${invariants.filter((i) => i.passed).length}/${invariants.length}`}
      />
      <Card flush>
        {invariants.map((invariant, index) => (
          <View key={invariant.name}>
            <View style={styles.check}>
              <Mark passed={invariant.passed} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkName}>{invariant.name}</Text>
                <Text style={styles.checkDetail}>{invariant.detail}</Text>
                <Text style={[styles.checkNumbers, tabular]}>
                  expected {invariant.expected.toFixed(4)} · actual {invariant.actual.toFixed(4)} ·
                  delta {Math.abs(invariant.expected - invariant.actual).toExponential(2)}
                </Text>
              </View>
            </View>
            {index < invariants.length - 1 ? <Divider inset={spacing.lg} /> : null}
          </View>
        ))}
      </Card>

      <SectionHeader title="Account details" />
      <Card>
        <View style={styles.facts}>
          <Fact label="Inception" value={shortDate(INCEPTION_DATE)} />
          <Fact label="Track record" value={`${summary.yearsHeld.toFixed(2)} yrs`} />
          <Fact label="Fills" value={String(TRADES.length)} />
          <Fact label="External cash events" value="1" />
          <Fact label="Open positions" value={String(positions.length)} />
          <Fact label="Down positions" value={String(summary.losers)} />
          <Fact label="CAGR" value={pct(summary.cagrPct, 1)} />
          <Fact label="Growth" value={`${summary.growth.toFixed(2)}x`} />
        </View>
        <Text style={styles.note}>
          Positions, cost basis, realised P&L and cash are replayed from the {TRADES.length}-row
          ledger on every render using average-cost accounting. No total is stored anywhere, so no
          two figures in the app can disagree. The ledger is the account&apos;s own transaction
          record, shipped with the app; prices are the only external input and come from the live
          quote feed.
        </Text>
      </Card>

      {/* Orders append to the ledger, so there has to be a way back to the
          record the app shipped with. */}
      <SectionHeader title="Orders placed in the app" aside={`${manualCount}`} />
      <Card>
        <Text style={styles.note}>
          {manualCount === 0
            ? 'None yet. Buy and sell from any position; orders fill at the last price and are written to this ledger, never sent to a broker.'
            : `${manualCount} order${manualCount === 1 ? '' : 's'} ${manualCount === 1 ? 'is' : 'are'} included in every figure above. Clearing them returns the account to the record the app shipped with.`}
        </Text>
        {manualCount > 0 && onReset ? (
          <Pressable style={styles.reset} onPress={onReset}>
            <Text style={styles.resetText}>Clear in-app orders</Text>
          </Pressable>
        ) : null}
      </Card>
    </ScrollView>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fact}>
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={[styles.factValue, tabular]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verdictTitle: { ...type.section, color: colors.text },
  verdictBody: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  meter: { height: 26, justifyContent: 'center', marginTop: 10 },
  meterTrack: { height: 4, backgroundColor: colors.cardRaised, borderRadius: 3 },
  meterBand: { position: 'absolute', height: 4, backgroundColor: colors.gain, opacity: 0.5, borderRadius: 3 },
  meterMark: { position: 'absolute', width: 3, height: 18, backgroundColor: colors.text, marginLeft: -1.5, borderRadius: 2 },
  note: { fontSize: 12, color: colors.textTertiary, lineHeight: 18, marginTop: 10 },
  check: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  checkName: { fontSize: 14, fontWeight: '600', color: colors.text },
  checkDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  checkNumbers: { fontSize: 11, color: colors.textTertiary, marginTop: 5 },
  facts: { flexDirection: 'row', flexWrap: 'wrap' },
  fact: { width: '50%', paddingVertical: 9 },
  factLabel: { fontSize: 12, color: colors.textSecondary },
  factValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 3 },
  reset: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.control,
    backgroundColor: colors.chip,
  },
  resetText: { fontSize: 14, fontWeight: '600', color: colors.loss },
});
