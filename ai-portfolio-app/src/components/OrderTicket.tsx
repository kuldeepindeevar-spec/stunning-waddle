/**
 * The order ticket.
 *
 * Market orders only, filled at the last price. The available balance, the
 * "Max" button and the accept/reject decision all come from one call to
 * checkOrder(), so the ticket cannot offer a size the ledger would refuse.
 */

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, tabular, type } from '../theme';
import { money, price as fmtPrice, shares } from '../lib/format';
import { instrumentFor } from '../data/instruments';
import { checkOrder, OrderSide } from '../lib/orders';
import type { Trade } from '../data/ledger';
import type { QuoteMap } from '../lib/portfolio';

const PRESETS = [0.25, 0.5, 0.75, 1];

export const OrderTicket = ({
  symbol,
  trades,
  quotes,
  onClose,
  onSubmit,
}: {
  symbol: string | null;
  trades: Trade[];
  quotes: QuoteMap;
  onClose: () => void;
  onSubmit: (side: OrderSide, quantity: number) => void;
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [text, setText] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const quantity = Number.parseInt(text, 10);
  const draft = { symbol: symbol ?? '', side, quantity: Number.isNaN(quantity) ? 0 : quantity };

  const check = useMemo(
    () => (symbol ? checkOrder(trades, quotes, draft) : null),
    [symbol, trades, quotes, side, text],
  );

  if (!symbol || !check) return null;

  const instrument = instrumentFor(symbol);
  const last = quotes[symbol]?.price ?? 0;
  const tint = side === 'BUY' ? colors.gainFill : colors.lossFill;

  const setPreset = (fraction: number) =>
    setText(String(Math.max(1, Math.floor(check.maxQuantity * fraction))));

  const submit = () => {
    if (!check.valid) {
      setError(check.reason ?? 'Order rejected.');
      return;
    }
    try {
      onSubmit(side, draft.quantity);
      setText('1');
      setError(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order rejected.');
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />

        {/* An explicit dismiss: the sheet is tall enough to cover the backdrop,
            so tapping outside it is not a reliable way out on a phone. */}
        <View style={styles.bar}>
          <Text style={styles.barTitle}>Order</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {instrument.name}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.lastLabel}>Last</Text>
            <Text style={[styles.last, tabular]}>{fmtPrice(last)}</Text>
          </View>
        </View>

        <View style={styles.sideRow}>
          {(['BUY', 'SELL'] as const).map((option) => {
            const active = option === side;
            const activeTint = option === 'BUY' ? colors.gainFill : colors.lossFill;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setSide(option);
                  setError(null);
                }}
                style={[
                  styles.sideBtn,
                  active && { backgroundColor: activeTint, borderColor: activeTint },
                ]}
              >
                <Text style={[styles.sideText, active && { color: '#fff' }]}>
                  {option === 'BUY' ? 'Buy' : 'Sell'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Quantity</Text>
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.stepper}
            onPress={() => setText(String(Math.max(1, (draft.quantity || 1) - 1)))}
          >
            <Text style={styles.stepperText}>−</Text>
          </Pressable>
          <TextInput
            style={[styles.qtyInput, tabular]}
            value={text}
            onChangeText={(next) => {
              setText(next.replace(/[^0-9]/g, ''));
              setError(null);
            }}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Pressable
            style={styles.stepper}
            onPress={() => setText(String((draft.quantity || 0) + 1))}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.presets}>
          {PRESETS.map((fraction) => (
            <Pressable key={fraction} style={styles.preset} onPress={() => setPreset(fraction)}>
              <Text style={styles.presetText}>
                {fraction === 1 ? 'Max' : `${fraction * 100}%`}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summary}>
          <Row label="Order value" value={money(check.value)} />
          <Row
            label={side === 'BUY' ? 'Available cash' : 'Shares held'}
            value={side === 'BUY' ? money(check.cash) : shares(check.held)}
            color={check.valid ? colors.text : colors.loss}
          />
        </View>

        {error || (!check.valid && draft.quantity > 0) ? (
          <Text style={styles.error}>{error ?? check.reason}</Text>
        ) : null}

        <Pressable
          onPress={submit}
          style={[styles.submit, { backgroundColor: check.valid ? tint : colors.chip }]}
        >
          <Text style={[styles.submitText, { color: check.valid ? '#fff' : colors.textTertiary }]}>
            {side === 'BUY' ? 'Buy' : 'Sell'} {draft.quantity > 0 ? shares(draft.quantity) : ''}{' '}
            {symbol}
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Market order, filled at the last price and written to this app&apos;s own ledger.
          Nothing is routed to a broker and no real money moves.
        </Text>
      </View>
    </Modal>
  );
};

const Row = ({ label, value, color = colors.text }: { label: string; value: string; color?: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, { color }, tabular]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barTitle: { fontSize: 13, color: colors.textSecondary },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  closeText: { fontSize: 20, color: colors.textSecondary },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  symbol: { fontSize: 22, fontWeight: '700', color: colors.text },
  name: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  lastLabel: { ...type.label, color: colors.textSecondary },
  last: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 },
  sideRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  sideBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.control,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sideText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  fieldLabel: { ...type.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepper: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 22, color: colors.text, lineHeight: 26 },
  qtyInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.chip,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  presets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.chip,
    backgroundColor: colors.chip,
  },
  presetText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  summary: { marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowLabel: { fontSize: 13, color: colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600' },
  error: { fontSize: 12, color: colors.loss, marginTop: spacing.sm, lineHeight: 17 },
  submit: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: 15, borderRadius: radius.control },
  submitText: { fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
