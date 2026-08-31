/**
 * The complete transaction history, plus the running cash balance after each
 * fill. The opening deposit is shown as the first row so the statement starts
 * from zero and reconciles forward.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, mono, pnlColor, spacing, type } from '../theme';
import { money, price as fmtPrice, shares, shortDate, signedMoney } from '../lib/format';
import { Divider, SectionHeader } from '../components/primitives';
import { INITIAL_CAPITAL, INCEPTION_DATE, TRADES } from '../data/ledger';
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
};

export const ActivityScreen = ({ realizedPnl }: { realizedPnl: number }) => {
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
      },
    ];

    let cash = INITIAL_CAPITAL;
    for (const trade of TRADES) {
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
      });
    }
    return out.reverse();
  }, []);

  const buys = TRADES.filter((t) => t.side === 'BUY').length;
  const sells = TRADES.length - buys;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SectionHeader
        title="Statement"
        right={
          <Text style={styles.aside}>
            {buys} buys · {sells} sells
          </Text>
        }
      />
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          {TRADES.length} fills since {shortDate(INCEPTION_DATE)}. Realised P&L across all
          closed share lots is{' '}
          <Text style={{ color: pnlColor(realizedPnl) }}>{signedMoney(realizedPnl)}</Text>, which
          stayed in the account and funded later buys.
        </Text>
      </View>

      <Divider />
      {lines.map((line) => (
        <View key={line.key}>
          <View style={styles.row}>
            <View style={styles.left}>
              <View style={styles.topLine}>
                <Text
                  style={[
                    styles.side,
                    {
                      color:
                        line.side === 'SELL'
                          ? colors.accent
                          : line.side === 'DEPOSIT'
                            ? colors.info
                            : colors.gain,
                    },
                  ]}
                >
                  {line.side}
                </Text>
                <Text style={styles.symbol}>{line.symbol}</Text>
                <Text style={styles.date}>{shortDate(line.date)}</Text>
              </View>
              <Text style={styles.detail}>
                {line.side === 'DEPOSIT'
                  ? line.detail
                  : `${line.detail} · ${instrumentFor(line.symbol).name}`}
              </Text>
              <Text style={styles.note} numberOfLines={2}>
                {line.note}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.gross, { color: pnlColor(line.gross) }]}>
                {signedMoney(line.gross)}
              </Text>
              <Text style={styles.cashLabel}>cash after</Text>
              <Text style={styles.cashAfter}>{money(line.cashAfter)}</Text>
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
  aside: { fontSize: 10, color: colors.textTertiary, fontFamily: mono },
  summaryBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
  },
  summaryText: { fontSize: 11, lineHeight: 17, color: colors.textSecondary },
  row: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: 10, gap: spacing.md },
  left: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  side: { ...type.micro, fontSize: 10 },
  symbol: { ...type.body, fontSize: 14, color: colors.text, fontWeight: '700' },
  date: { fontSize: 10, color: colors.textTertiary },
  detail: { fontFamily: mono, fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  note: { fontSize: 10, color: colors.textTertiary, marginTop: 3, lineHeight: 14 },
  right: { alignItems: 'flex-end' },
  gross: { fontFamily: mono, fontSize: 13, fontWeight: '600' },
  cashLabel: { ...type.micro, fontSize: 8, color: colors.textTertiary, marginTop: 5 },
  cashAfter: { fontFamily: mono, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
