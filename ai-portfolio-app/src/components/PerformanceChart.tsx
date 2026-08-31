/**
 * Net liquidation value since inception, on a log scale.
 *
 * A 20x move is unreadable on a linear axis — the first three years compress
 * into the baseline. Log spacing keeps every year legible and makes equal
 * percentage moves equal distances, which is what the axis is for.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Circle } from 'react-native-svg';

import { colors, mono, spacing, type } from '../theme';
import { axisDate, wholeMoney } from '../lib/format';
import type { EquityCurve } from '../lib/history';

type Props = {
  curve: EquityCurve;
  height?: number;
};

export const PerformanceChart = ({ curve, height = 168 }: Props) => {
  const [width, setWidth] = React.useState(0);
  const padLeft = 4;
  const padRight = 52;
  const padTop = 10;
  const padBottom = 20;

  const geometry = useMemo(() => {
    const points = curve.points;
    if (points.length < 2 || width <= 0) return null;

    const xs = points.map((p) => p.t);
    const ys = points.map((p) => Math.log(Math.max(p.value, 1)));
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const ySpan = yMax - yMin || 1;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const sx = (t: number) => padLeft + ((t - xMin) / (xMax - xMin || 1)) * plotW;
    const sy = (v: number) =>
      padTop + plotH - ((Math.log(Math.max(v, 1)) - yMin) / ySpan) * plotH;

    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.t).toFixed(2)},${sy(p.value).toFixed(2)}`)
      .join(' ');
    const area = `${line} L${sx(xMax).toFixed(2)},${(padTop + plotH).toFixed(2)} L${sx(
      xMin,
    ).toFixed(2)},${(padTop + plotH).toFixed(2)} Z`;

    // Decade gridlines: 100k, 1M, and whatever else the range covers.
    const gridValues: number[] = [];
    for (let exp = 4; exp <= 8; exp += 1) {
      const value = Math.pow(10, exp);
      if (Math.log(value) >= yMin && Math.log(value) <= yMax) gridValues.push(value);
    }

    const yearTicks: number[] = [];
    let year = new Date(xMin).getUTCFullYear() + 1;
    while (Date.UTC(year, 0, 1) < xMax) {
      yearTicks.push(Date.UTC(year, 0, 1));
      year += 1;
    }

    const last = points[points.length - 1];
    return { sx, sy, line, area, gridValues, yearTicks, plotH, last };
  }, [curve, width, height]);

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {geometry ? (
        <>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.chartFillTop} />
                <Stop offset="1" stopColor={colors.chartFillBottom} />
              </LinearGradient>
            </Defs>

            {geometry.gridValues.map((value) => (
              <Line
                key={`g${value}`}
                x1={padLeft}
                x2={width - padRight}
                y1={geometry.sy(value)}
                y2={geometry.sy(value)}
                stroke={colors.grid}
                strokeWidth={1}
              />
            ))}
            {geometry.yearTicks.map((t) => (
              <Line
                key={`y${t}`}
                x1={geometry.sx(t)}
                x2={geometry.sx(t)}
                y1={padTop}
                y2={padTop + geometry.plotH}
                stroke={colors.grid}
                strokeWidth={1}
              />
            ))}

            <Path d={geometry.area} fill="url(#areaFill)" />
            <Path
              d={geometry.line}
              stroke={colors.chartLine}
              strokeWidth={1.75}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle
              cx={geometry.sx(geometry.last.t)}
              cy={geometry.sy(geometry.last.value)}
              r={3}
              fill={colors.chartLine}
            />
          </Svg>

          {geometry.gridValues.map((value) => (
            <Text
              key={`l${value}`}
              style={[styles.axisY, { top: geometry.sy(value) - 6, right: spacing.sm }]}
            >
              {value >= 1e6 ? `${value / 1e6}M` : `${value / 1e3}K`}
            </Text>
          ))}
          {geometry.yearTicks.map((t) => (
            <Text
              key={`x${t}`}
              style={[styles.axisX, { left: geometry.sx(t) - 16, bottom: 2 }]}
            >
              {axisDate(t)}
            </Text>
          ))}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              LOG SCALE · {curve.basis === 'marked' ? 'MARKED MONTHLY' : 'INDICATIVE PATH'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Building curve…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
  },
  axisY: {
    position: 'absolute',
    fontFamily: mono,
    fontSize: 9,
    color: colors.textTertiary,
  },
  axisX: {
    position: 'absolute',
    fontFamily: mono,
    fontSize: 9,
    color: colors.textTertiary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: spacing.xs,
  },
  badgeText: {
    ...type.micro,
    fontSize: 8,
    color: colors.textTertiary,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 12 },
});

/** Legend line under the chart. */
export const ChartFooter = ({ curve }: { curve: EquityCurve }) => {
  if (curve.points.length < 2) return null;
  const first = curve.points[0];
  const last = curve.points[curve.points.length - 1];
  return (
    <View style={footerStyles.row}>
      <Text style={footerStyles.text} numberOfLines={1}>
        {wholeMoney(first.value)} → {wholeMoney(last.value)} ·{' '}
        {curve.basis === 'marked'
          ? 'month-end closes replayed against the ledger'
          : 'endpoints exact, path interpolated'}
      </Text>
    </View>
  );
};

const footerStyles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: 9,
    color: colors.textTertiary,
    fontFamily: mono,
    flexShrink: 1,
  },
});
