/** Small shared building blocks: labels, dividers, pills, section headers. */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, mono, spacing, type } from '../theme';

export const Divider = ({ inset = 0 }: { inset?: number }) => (
  <View style={[styles.divider, { marginLeft: inset }]} />
);

export const SectionHeader = ({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right}
  </View>
);

export const Pill = ({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'live' | 'stale' | 'accent';
}) => {
  const tint =
    tone === 'live'
      ? colors.gain
      : tone === 'stale'
        ? colors.accent
        : tone === 'accent'
          ? colors.info
          : colors.textTertiary;
  return (
    <View style={[styles.pill, { borderColor: tint }]}>
      <Text style={[styles.pillText, { color: tint }]}>{label}</Text>
    </View>
  );
};

/** A right-aligned figure in tabular type, the workhorse of every blotter. */
export const Figure = ({
  value,
  color = colors.text,
  size = 13,
  weight = '600',
  style,
}: {
  value: string;
  color?: string;
  size?: number;
  weight?: '400' | '500' | '600' | '700';
  style?: ViewStyle;
}) => (
  <Text
    style={[
      { fontFamily: mono, fontSize: size, color, fontWeight: weight, textAlign: 'right' },
      style as never,
    ]}
    numberOfLines={1}
  >
    {value}
  </Text>
);

/** Label above a figure, used in the summary grids. */
export const StatCell = ({
  label,
  value,
  color = colors.text,
  align = 'left',
}: {
  label: string;
  value: string;
  color?: string;
  align?: 'left' | 'right';
}) => (
  <View style={{ flex: 1, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...type.section,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pillText: {
    ...type.micro,
    textTransform: 'uppercase',
  },
  statLabel: {
    ...type.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  statValue: {
    fontFamily: mono,
    fontSize: 14,
    fontWeight: '600',
  },
});
