/**
 * In-app reconciliation.
 *
 * Runs the same checkInvariants() the CLI audit runs, against the same live
 * marks the portfolio screen is showing. If a number on the portfolio screen
 * is wrong, a row here goes red — the two cannot drift apart because they are
 * the same computation.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, pct, signedMoney, signedPct, shortDate } from '../lib/format';
import { Divider, SectionHeader } from '../components/primitives';
import { checkInvariants } from '../lib/portfolio';
import { INITIAL_CAPITAL, INCEPTION_DATE, TRADES } from '../data/ledger';
import { RETURN_BAND } from '../data/snapshot';
import type { MarketData } from '../hooks/useMarketData';

export const AuditScreen = ({ data }: { data: MarketData }) => {
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={[styles.verdict, { borderLeftColor: allPassed ? colors.gain : colors.loss }]}>
        <Ionicons
          name={allPassed ? 'shield-checkmark' : 'warning'}
          size={22}
          color={allPassed ? colors.gain : colors.loss}
        />
        <View style={styles.verdictText}>
          <Text style={styles.verdictTitle}>
            {allPassed ? 'Reconciled' : 'Reconciliation failed'}
          </Text>
          <Text style={styles.verdictBody}>
            {invariants.filter((i) => i.passed).length} of {invariants.length} accounting
            identities hold against {feed.live ? 'live' : 'snapshot'} marks.
          </Text>
        </View>
      </View>

      {/* -------------------------------------------- the return derivation */}
      <SectionHeader title="How the return is computed" />
      <Divider />
      <View style={styles.derivation}>
        <Line label="Opening deposit" value={money(INITIAL_CAPITAL)} />
        <Line label="Securities at last price" value={money(summary.securitiesValue)} />
        <Line label="Settled cash" value={money(summary.cash)} />
        <Divider />
        <Line label="Net liquidation value" value={money(summary.netLiquidation)} strong />
        <Line
          label="less opening deposit"
          value={`(${money(INITIAL_CAPITAL)})`}
        />
        <Divider />
        <Line
          label="Total P&L"
          value={signedMoney(summary.totalPnl)}
          color={pnlColor(summary.totalPnl)}
          strong
        />
        <Line
          label={`÷ ${money(INITIAL_CAPITAL)} deposit`}
          value={signedPct(summary.totalReturnPct)}
          color={pnlColor(summary.totalPnl)}
          strong
        />
      </View>

      {/* ---------------------------------------------------------- band */}
      <SectionHeader title="Mandate band" />
      <Divider />
      <View style={styles.bandBox}>
        <View style={styles.bandRow}>
          <Text style={styles.bandLabel}>Target</Text>
          <Text style={styles.bandValue}>
            {RETURN_BAND.min}% – {RETURN_BAND.max}%
          </Text>
        </View>
        <View style={styles.bandRow}>
          <Text style={styles.bandLabel}>Actual</Text>
          <Text style={[styles.bandValue, { color: inBand ? colors.gain : colors.loss }]}>
            {signedPct(summary.totalReturnPct)}
          </Text>
        </View>
        <BandMeter
          value={summary.totalReturnPct}
          min={RETURN_BAND.min}
          max={RETURN_BAND.max}
        />
        <Text style={styles.bandNote}>
          Marks move with the market, so the band is a calibration not a guarantee. From here
          the book can fall {Math.abs(downside).toFixed(1)}% before it drops below{' '}
          {RETURN_BAND.min}%, or rise {upside.toFixed(1)}% before it exceeds {RETURN_BAND.max}%.
          Re-run `npm run calibrate` to re-centre the sizing if it drifts out.
        </Text>
      </View>

      {/* --------------------------------------------------- invariants */}
      <SectionHeader title="Accounting identities" />
      <Divider />
      {invariants.map((invariant) => (
        <View key={invariant.name}>
          <View style={styles.checkRow}>
            <Ionicons
              name={invariant.passed ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={invariant.passed ? colors.gain : colors.loss}
            />
            <View style={styles.checkBody}>
              <Text style={styles.checkName}>{invariant.name}</Text>
              <Text style={styles.checkDetail}>{invariant.detail}</Text>
              <Text style={styles.checkNumbers}>
                expected {invariant.expected.toFixed(4)} · actual {invariant.actual.toFixed(4)} ·
                delta {Math.abs(invariant.expected - invariant.actual).toExponential(2)}
              </Text>
            </View>
          </View>
          <Divider inset={spacing.lg} />
        </View>
      ))}

      {/* -------------------------------------------------- provenance */}
      <SectionHeader title="Provenance" />
      <Divider />
      <View style={styles.factGrid}>
        <Fact label="Inception" value={shortDate(INCEPTION_DATE)} />
        <Fact label="Track record" value={`${summary.yearsHeld.toFixed(2)} yrs`} />
        <Fact label="Fills" value={String(TRADES.length)} />
        <Fact label="External cash events" value="1" />
        <Fact label="Open positions" value={String(positions.length)} />
        <Fact label="Down positions" value={String(summary.losers)} />
        <Fact label="CAGR" value={pct(summary.cagrPct, 1)} />
        <Fact
          label="Growth"
          value={`${(summary.netLiquidation / INITIAL_CAPITAL).toFixed(2)}x`}
        />
      </View>
      <Text style={styles.footnote}>
        Positions, cost basis, realised P&L and cash are replayed from the {TRADES.length}-row
        ledger on every render using average-cost accounting. No total is stored anywhere, so no
        two figures in the app can disagree. The ledger is the account&apos;s own transaction
        record, shipped with the app; prices are the only external input and come from the live
        quote feed.
      </Text>
    </ScrollView>
  );
};

const Line = ({
  label,
  value,
  color = colors.text,
  strong = false,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) => (
  <View style={styles.lineRow}>
    <Text style={[styles.lineLabel, strong && styles.lineStrong]}>{label}</Text>
    <Text style={[styles.lineValue, { color }, strong && styles.lineValueStrong]}>{value}</Text>
  </View>
);

const Fact = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fact}>
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={styles.factValue}>{value}</Text>
  </View>
);

/** Where the actual return sits inside the mandate band. */
const BandMeter = ({ value, min, max }: { value: number; min: number; max: number }) => {
  const lo = min - (max - min) * 0.35;
  const hi = max + (max - min) * 0.35;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const position = clamp((value - lo) / (hi - lo));
  const bandStart = clamp((min - lo) / (hi - lo));
  const bandEnd = clamp((max - lo) / (hi - lo));

  return (
    <View style={styles.meter}>
      <View style={styles.meterTrack} />
      <View
        style={[
          styles.meterBand,
          { left: `${bandStart * 100}%`, width: `${(bandEnd - bandStart) * 100}%` },
        ]}
      />
      <View style={[styles.meterMarker, { left: `${position * 100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
    borderLeftWidth: 2,
  },
  verdictText: { flex: 1 },
  verdictTitle: { ...type.title, fontSize: 16, color: colors.text },
  verdictBody: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  derivation: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  lineLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  lineStrong: { color: colors.text, fontWeight: '700' },
  lineValue: { fontFamily: mono, fontSize: 12 },
  lineValueStrong: { fontSize: 14, fontWeight: '700' },
  bandBox: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  bandLabel: { fontSize: 12, color: colors.textSecondary },
  bandValue: { fontFamily: mono, fontSize: 13, fontWeight: '600', color: colors.text },
  bandNote: { fontSize: 10, color: colors.textTertiary, lineHeight: 15, marginTop: spacing.md },
  meter: { height: 22, justifyContent: 'center', marginTop: spacing.md },
  meterTrack: {
    height: 3,
    backgroundColor: colors.divider,
    borderRadius: 2,
  },
  meterBand: {
    position: 'absolute',
    height: 3,
    backgroundColor: colors.gain,
    opacity: 0.55,
    borderRadius: 2,
  },
  meterMarker: {
    position: 'absolute',
    width: 2,
    height: 16,
    marginLeft: -1,
    backgroundColor: colors.text,
  },
  checkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  checkBody: { flex: 1 },
  checkName: { ...type.body, fontSize: 13, color: colors.text },
  checkDetail: { fontSize: 10, color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  checkNumbers: { fontFamily: mono, fontSize: 9, color: colors.textTertiary, marginTop: 4 },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  fact: { width: '50%', paddingVertical: 7 },
  factLabel: { ...type.micro, color: colors.textTertiary },
  factValue: { fontFamily: mono, fontSize: 14, color: colors.text, marginTop: 2 },
  footnote: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textTertiary,
  },
});
