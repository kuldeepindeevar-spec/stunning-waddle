/**
 * The complete transaction history, plus the running cash balance after each
 * fill. The opening deposit is shown as the first row so the statement starts
 * from zero and reconciles forward.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, pnlColor, radius, spacing, tabular } from '../theme';
import { money, price as fmtPrice, shares, shortDate, signedMoney } from '../lib/format';
import { Card, Divider, SectionHeader } from '../components/primitives';
import { INITIAL_CAPITAL, INCEPTION_DATE, TRADES, Trade } from '../data/ledger';
import { isManual } from '../lib/orders';
import { instrumentFor } from '../data/instruments';

type Line = {
  key: string;
  date: string;
  side: 'DEPOSIT' | 'BUY' | 'SELL';
  symbol: string;
  detail: string;
  gross: number;
  cashAfter: number;
  note: string;
  /** True for orders placed in the app, false for the shipped record. */
  manual: boolean;
};

export const ActivityScreen = ({
  trades = TRADES,
  realizedPnl,
}: {
  trades?: Trade[];
  realizedPnl: number;
}) => {
  const lines = useMemo<Line[]>(() => {
    const out: Line[] = [
      {
        key: 'deposit',
        date: INCEPTION_DATE,
        side: 'DEPOSIT',
        symbol: 'USD',
        detail: 'Account funded',
        gross: INITIAL_CAPITAL,
        cashAfter: INITIAL_CAPITAL,
        note: 'The only external cash movement in the account’s history.',
        manual: false,
      },
    ];

    let cash = INITIAL_CAPITAL;
    for (const trade of trades) {
      const gross = trade.quantity * trade.price;
      cash += trade.side === 'BUY' ? -gross : gross;
      out.push({
        key: trade.id,
        date: trade.date,
        side: trade.side,
        symbol: trade.symbol,
        detail: `${shares(trade.quantity)} @ ${fmtPrice(trade.price)}`,
        gross: trade.side === 'BUY' ? -gross : gross,
        cashAfter: cash,
        note: trade.note,
        manual: isManual(trade),
      });
    }
    return out.reverse();
  }, [trades]);

  const buys = trades.filter((t) => t.side === 'BUY').length;
  const manualCount = trades.filter(isManual).length;

  const tagStyle = (side: Line['side']) =>
    side === 'SELL'
      ? { color: colors.loss, backgroundColor: colors.lossWash }
      : side === 'DEPOSIT'
        ? { color: colors.accountMark, backgroundColor: 'rgba(43,127,255,0.14)' }
        : { color: colors.gain, backgroundColor: colors.gainWash };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SectionHeader title="Statement" aside={`${buys} buys · ${trades.length - buys} sells`} />
      <Card>
        <Text style={styles.summary}>
          {trades.length} fills since {shortDate(INCEPTION_DATE)}
          {manualCount > 0 ? `, ${manualCount} placed in the app` : ''}. Realised P&L across all closed
          share lots is{' '}
          <Text style={{ color: pnlColor(realizedPnl) }}>{signedMoney(realizedPnl)}</Text>, which
          stayed in the account and funded later buys.
        </Text>
      </Card>

      <Card flush>
        {lines.map((line, index) => {
          const tag = tagStyle(line.side);
          const instrument = line.side === 'DEPOSIT' ? null : instrumentFor(line.symbol);
          return (
            <View key={line.key}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <View style={styles.top}>
                    <Text style={[styles.tag, { color: tag.color, backgroundColor: tag.backgroundColor }]}>
                      {line.side}
                    </Text>
                    <Text style={styles.symbol}>{line.symbol}</Text>
                    <Text style={styles.date}>{shortDate(line.date)}</Text>
                    {line.manual ? <Text style={styles.manualTag}>IN-APP</Text> : null}
                  </View>
                  <Text style={[styles.detail, tabular]}>
                    {line.detail}
                    {instrument ? ` · ${instrument.name}` : ''}
                  </Text>
                  <Text style={styles.note}>{line.note}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.gross, { color: pnlColor(line.gross) }, tabular]}>
                    {signedMoney(line.gross)}
                  </Text>
                  <Text style={[styles.cashAfter, tabular]}>cash {money(line.cashAfter)}</Text>
                </View>
              </View>
              {index < lines.length - 1 ? <Divider inset={spacing.lg} /> : null}
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  summary: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  row: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: 13, gap: spacing.md },
  left: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  symbol: { fontSize: 15, fontWeight: '700', color: colors.text },
  manualTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.brand,
    backgroundColor: colors.brandWash,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  date: { fontSize: 11, color: colors.textTertiary },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  note: { fontSize: 11, color: colors.textTertiary, marginTop: 4, lineHeight: 15 },
  right: { alignItems: 'flex-end' },
  gross: { fontSize: 15, fontWeight: '600' },
  cashAfter: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
});
