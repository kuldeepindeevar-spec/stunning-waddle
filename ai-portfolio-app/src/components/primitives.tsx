/** Shared building blocks: cards, section headers, chips, stat cells. */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, spacing, tabular, type } from '../theme';

/** The rounded surface everything sits on. */
export const Card = ({
  children,
  style,
  flush = false,
}: {
  children: React.ReactNode;
  /** flush removes the inner padding, for lists that draw their own rows. */
  flush?: boolean;
  style?: ViewStyle;
}) => <View style={[styles.card, !flush && styles.cardPad, style]}>{children}</View>;

export const Divider = ({ inset = 0 }: { inset?: number }) => (
  <View style={[styles.divider, { marginLeft: inset }]} />
);

export const SectionHeader = ({ title, aside }: { title: string; aside?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {aside ? <Text style={styles.sectionAside}>{aside}</Text> : null}
  </View>
);

/** Grey caption above a figure. */
export const Label = ({ children, dotted = false }: { children: React.ReactNode; dotted?: boolean }) => (
  <Text style={[styles.label, dotted && styles.labelDotted]}>{children}</Text>
);

/** Solid-filled percentage chip — the loudest element in a list row. */
export const PctChip = ({ value, text }: { value: number; text: string }) => {
  const background =
    value > 0 ? colors.gainFill : value < 0 ? colors.lossFill : colors.cardRaised;
  const tint = value === 0 ? colors.textSecondary : '#ffffff';
  return (
    <View style={[styles.pctChip, { backgroundColor: background }]}>
      <Text style={[styles.pctChipText, { color: tint }, tabular]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

/** Small status pill, outlined by tone rather than filled. */
export const StatusPill = ({ label, tone }: { label: string; tone: 'live' | 'stale' }) => (
  <View
    style={[
      styles.statusPill,
      { backgroundColor: tone === 'live' ? colors.gainWash : colors.brandWash },
    ]}
  >
    <Text style={[styles.statusPillText, { color: tone === 'live' ? colors.gain : colors.brand }]}>
      {label}
    </Text>
  </View>
);

/** Horizontally scrolling filter chips. */
export const ChipRow = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.chipRow}
  >
    {options.map((option) => {
      const active = option === value;
      return (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.chip, active && styles.chipActive]}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

/** One cell of the three-across summary strip. */
export const StatCell = ({
  label,
  value,
  color = colors.text,
  align = 'left',
  dotted = false,
}: {
  label: string;
  value: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  dotted?: boolean;
}) => (
  <View style={{ flex: 1, alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
    <Label dotted={dotted}>{label}</Label>
    <Text style={[styles.statValue, { color }, tabular]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

/** Label on the left, figure on the right. */
export const KeyValue = ({
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
  <View style={styles.kv}>
    <Text style={[styles.kvKey, strong && styles.kvKeyStrong]}>{label}</Text>
    <Text style={[styles.kvValue, strong && styles.kvValueStrong, { color }, tabular]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardPad: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: { ...type.section, color: colors.text },
  sectionAside: { ...type.label, color: colors.textSecondary },
  label: { ...type.label, color: colors.textSecondary },
  labelDotted: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: colors.textTertiary,
    alignSelf: 'flex-start',
  },
  pctChip: {
    minWidth: 78,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  pctChipText: { fontSize: 14, fontWeight: '700' },
  statusPill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  statusPillText: { ...type.micro, fontWeight: '800', textTransform: 'uppercase' },
  chipRow: { paddingHorizontal: spacing.lg, paddingBottom: 14, gap: spacing.sm },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    backgroundColor: colors.chip,
  },
  chipActive: { backgroundColor: colors.chipActive },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.brand },
  statValue: { fontSize: 15, fontWeight: '600', marginTop: 5 },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  kvKey: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  kvKeyStrong: { color: colors.text, fontWeight: '700' },
  kvValue: { fontSize: 14, fontWeight: '600' },
  kvValueStrong: { fontSize: 16, fontWeight: '700' },
});
