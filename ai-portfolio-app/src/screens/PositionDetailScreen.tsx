/**
 * Position detail: the full derivation for one line, plus the trades that
 * produced it. This is where "why is my cost basis that number" gets answered.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, pnlColor, spacing, tabular, type } from '../theme';
import { money, price as fmtPrice, shares, shortDate, signedMoney, signedPct, pct } from '../lib/format';
import { Card, Divider, KeyValue, Label, SectionHeader } from '../components/primitives';
import { instrumentFor } from '../data/instruments';
import { TRADES } from '../data/ledger';
import type { Portfolio } from '../lib/portfolio';

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
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5l-7 7 7 7" stroke={colors.textSecondary} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
        <Text style={styles.backText}>Portfolio</Text>
      </Pressable>

      <Card>
        <Text style={styles.symbol}>{position.symbol}</Text>
        <Text style={styles.name}>{instrument.name}</Text>
        <Text style={styles.venue}>
          {instrument.exchange} · {instrument.currency} · {instrument.sector}
        </Text>
        <Text style={[styles.last, { color: dayTone }, tabular]}>{fmtPrice(position.price)}</Text>
        <Text style={[styles.dayLine, { color: dayTone }, tabular]}>
          {signedMoney(position.dayChange)} ({signedPct(position.dayChangePct)}) today
        </Text>
      </Card>

      <Card>
        <Label>Thesis</Label>
        <Text style={styles.thesis}>{instrument.thesis}</Text>
      </Card>

      <SectionHeader title="Position" />
      <Card>
        <KeyValue label="Quantity" value={shares(position.quantity)} />
        <KeyValue label="Average cost" value={fmtPrice(position.averageCost)} />
        <KeyValue label="Cost basis" value={money(position.costBasis)} />
        <KeyValue label="Last price" value={fmtPrice(position.price)} />
        <KeyValue label="Market value" value={money(position.marketValue)} />
        <KeyValue label="Unrealised P&L" value={signedMoney(position.unrealizedPnl)} color={pnlTone} />
        <KeyValue label="Unrealised return" value={signedPct(position.unrealizedPct)} color={pnlTone} />
        <KeyValue
          label="Realised P&L"
          value={signedMoney(position.realizedPnl)}
          color={pnlColor(position.realizedPnl)}
        />
        <KeyValue label="Portfolio weight" value={pct(position.weight * 100, 2)} />
        <KeyValue label="First bought" value={shortDate(position.firstBuyDate)} />
      </Card>

      <SectionHeader title="Check" />
      <Card>
        <Text style={[styles.proof, tabular]}>
          {shares(position.quantity)} × {fmtPrice(position.price)} = {money(position.marketValue)}
        </Text>
        <Text style={[styles.proof, tabular]}>
          {money(position.marketValue)} − {money(position.costBasis)} ={' '}
          <Text style={{ color: pnlTone }}>{signedMoney(position.unrealizedPnl)}</Text>
        </Text>
        <Text style={[styles.proof, tabular]}>
          {signedMoney(position.unrealizedPnl)} ÷ {money(position.costBasis)} ={' '}
          <Text style={{ color: pnlTone }}>{signedPct(position.unrealizedPct)}</Text>
        </Text>
      </Card>

      <SectionHeader title={`Trades (${trades.length})`} />
      <Card flush>
        {trades.map((trade, index) => (
          <View key={trade.id}>
            <View style={styles.tradeRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.tradeTop}>
                  <Text
                    style={[
                      styles.tag,
                      trade.side === 'BUY'
                        ? { color: colors.gain, backgroundColor: colors.gainWash }
                        : { color: colors.loss, backgroundColor: colors.lossWash },
                    ]}
                  >
                    {trade.side}
                  </Text>
                  <Text style={styles.tradeDate}>{shortDate(trade.date)}</Text>
                </View>
                <Text style={styles.tradeNote}>{trade.note}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.tradeQty, tabular]}>
                  {shares(trade.quantity)} @ {fmtPrice(trade.price)}
                </Text>
                <Text style={[styles.tradeGross, tabular]}>
                  {money(trade.quantity * trade.price)}
                </Text>
              </View>
            </View>
            {index < trades.length - 1 ? <Divider inset={spacing.lg} /> : null}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: { color: colors.textSecondary, padding: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingBottom: spacing.sm },
  backText: { color: colors.textSecondary, fontSize: 15 },
  symbol: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  name: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  venue: { fontSize: 12, color: colors.textTertiary, marginTop: 6 },
  last: { fontSize: 32, fontWeight: '600', letterSpacing: -0.8, marginTop: 14 },
  dayLine: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  thesis: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 6 },
  proof: { fontSize: 13, color: colors.textSecondary, lineHeight: 24 },
  tradeRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: 13, gap: spacing.md },
  tradeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tradeDate: { fontSize: 11, color: colors.textTertiary },
  tradeNote: { fontSize: 11, color: colors.textTertiary, marginTop: 4, lineHeight: 15 },
  tradeQty: { fontSize: 14, fontWeight: '600', color: colors.text },
  tradeGross: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
});
