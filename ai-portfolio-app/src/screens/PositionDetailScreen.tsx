/**
 * Position detail: the full derivation for one line, plus the trades that
 * produced it. This is where "why is my cost basis that number" gets answered.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, price as fmtPrice, shares, shortDate, signedMoney, signedPct, pct } from '../lib/format';
import { Divider, SectionHeader } from '../components/primitives';
import { instrumentFor } from '../data/instruments';
import { TRADES } from '../data/ledger';
import type { Portfolio } from '../lib/portfolio';

const DetailRow = ({
  label,
  value,
  color = colors.text,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
    <Divider inset={spacing.lg} />
  </>
);

export const PositionDetailScreen = ({
  symbol,
  portfolio,
  onBack,
}: {
  symbol: string;
  portfolio: Portfolio;
  onBack: () => void;
}) => {
  const position = portfolio.positions.find((p) => p.symbol === symbol);
  const instrument = instrumentFor(symbol);
  const trades = TRADES.filter((trade) => trade.symbol === symbol);

  if (!position) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>No open position in {symbol}.</Text>
      </View>
    );
  }

  const pnlTone = pnlColor(position.unrealizedPnl);
  const dayTone = pnlColor(position.dayChange);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Pressable onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.info} />
        <Text style={styles.backText}>Portfolio</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.symbol}>{position.symbol}</Text>
        <Text style={styles.name}>{instrument.name}</Text>
        <Text style={styles.venue}>
          {instrument.exchange} · {instrument.currency} · {instrument.sector}
        </Text>

        <Text style={[styles.last, { color: dayTone }]}>{fmtPrice(position.price)}</Text>
        <Text style={[styles.dayLine, { color: dayTone }]}>
          {signedMoney(position.dayChange)} ({signedPct(position.dayChangePct)}) today
        </Text>
      </View>

      <View style={styles.thesisBox}>
        <Text style={styles.thesisLabel}>Thesis</Text>
        <Text style={styles.thesis}>{instrument.thesis}</Text>
      </View>

      <SectionHeader title="Position" />
      <Divider />
      <DetailRow label="Quantity" value={shares(position.quantity)} />
      <DetailRow label="Average cost" value={fmtPrice(position.averageCost)} />
      <DetailRow label="Cost basis" value={money(position.costBasis)} />
      <DetailRow label="Last price" value={fmtPrice(position.price)} />
      <DetailRow label="Market value" value={money(position.marketValue)} />
      <DetailRow
        label="Unrealised P&L"
        value={signedMoney(position.unrealizedPnl)}
        color={pnlTone}
      />
      <DetailRow
        label="Unrealised return"
        value={signedPct(position.unrealizedPct)}
        color={pnlTone}
      />
      <DetailRow
        label="Realised P&L"
        value={signedMoney(position.realizedPnl)}
        color={pnlColor(position.realizedPnl)}
      />
      <DetailRow label="Portfolio weight" value={pct(position.weight * 100, 2)} />
      <DetailRow label="First bought" value={shortDate(position.firstBuyDate)} />

      <SectionHeader title="Check" />
      <Divider />
      <View style={styles.proofBox}>
        <Text style={styles.proof}>
          {shares(position.quantity)} × {fmtPrice(position.price)} = {money(position.marketValue)}
        </Text>
        <Text style={styles.proof}>
          {money(position.marketValue)} − {money(position.costBasis)} ={' '}
          <Text style={{ color: pnlTone }}>{signedMoney(position.unrealizedPnl)}</Text>
        </Text>
        <Text style={styles.proof}>
          {signedMoney(position.unrealizedPnl)} ÷ {money(position.costBasis)} ={' '}
          <Text style={{ color: pnlTone }}>{signedPct(position.unrealizedPct)}</Text>
        </Text>
      </View>

      <SectionHeader title={`Trades (${trades.length})`} />
      <Divider />
      {trades.map((trade) => (
        <View key={trade.id}>
          <View style={styles.tradeRow}>
            <View style={styles.tradeLeft}>
              <View style={styles.tradeTop}>
                <Text
                  style={[
                    styles.side,
                    { color: trade.side === 'BUY' ? colors.gain : colors.accent },
                  ]}
                >
                  {trade.side}
                </Text>
                <Text style={styles.tradeDate}>{shortDate(trade.date)}</Text>
              </View>
              <Text style={styles.tradeNote} numberOfLines={2}>
                {trade.note}
              </Text>
            </View>
            <View style={styles.tradeRight}>
              <Text style={styles.tradeQty}>
                {shares(trade.quantity)} @ {fmtPrice(trade.price)}
              </Text>
              <Text style={styles.tradeGross}>{money(trade.quantity * trade.price)}</Text>
            </View>
          </View>
          <Divider inset={spacing.lg} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: { color: colors.textSecondary, padding: spacing.lg },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backText: { color: colors.info, fontSize: 14 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  symbol: { fontSize: 26, fontWeight: '700', color: colors.text },
  name: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  venue: { ...type.micro, color: colors.textTertiary, marginTop: 4 },
  last: { fontFamily: mono, fontSize: 30, fontWeight: '600', marginTop: spacing.md },
  dayLine: { fontFamily: mono, fontSize: 12, marginTop: 2 },
  thesisBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
  },
  thesisLabel: { ...type.micro, color: colors.textTertiary, marginBottom: 4 },
  thesis: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontFamily: mono, fontSize: 13, fontWeight: '600' },
  proofBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 6,
  },
  proof: { fontFamily: mono, fontSize: 11, color: colors.textSecondary },
  tradeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.md,
  },
  tradeLeft: { flex: 1 },
  tradeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  side: { ...type.micro, fontSize: 11 },
  tradeDate: { fontSize: 11, color: colors.textSecondary },
  tradeNote: { fontSize: 10, color: colors.textTertiary, marginTop: 3, lineHeight: 14 },
  tradeRight: { alignItems: 'flex-end' },
  tradeQty: { fontFamily: mono, fontSize: 12, color: colors.text },
  tradeGross: { fontFamily: mono, fontSize: 10, color: colors.textTertiary, marginTop: 3 },
});
