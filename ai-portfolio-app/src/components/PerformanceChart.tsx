/**
 * Net liquidation value since inception, on a log scale.
 *
 * A multi-fold move is unreadable on a linear axis — the early years compress
 * into the baseline. Log spacing keeps every year legible and makes equal
 * percentage moves equal distances, which is what the axis is for.
 *
 * The chart is full-bleed inside its card: it sizes itself to the width it is
 * given, so it must not sit inside a padded block.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { colors, spacing, tabular } from '../theme';
import { axisDate, wholeMoney } from '../lib/format';
import type { EquityCurve } from '../lib/history';

export const PerformanceChart = ({
  curve,
  height = 150,
}: {
  curve: EquityCurve;
  height?: number;
}) => {
  const [width, setWidth] = React.useState(0);
  const padRight = 46;
  const padTop = 8;
  const padBottom = 18;

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

    const plotW = width - padRight;
    const plotH = height - padTop - padBottom;
    const sx = (t: number) => ((t - xMin) / (xMax - xMin || 1)) * plotW;
    const sy = (v: number) =>
      padTop + plotH - ((Math.log(Math.max(v, 1)) - yMin) / ySpan) * plotH;

    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.t).toFixed(2)},${sy(p.value).toFixed(2)}`)
      .join(' ');
    const area = `${line} L${sx(xMax).toFixed(2)},${(padTop + plotH).toFixed(2)} L${sx(
      xMin,
    ).toFixed(2)},${(padTop + plotH).toFixed(2)} Z`;

    // Gridlines at 1, 2 and 5 per decade. Whole decades alone leave a range
    // that spans less than 10x with a single line on it.
    const gridValues: number[] = [];
    for (let exp = 4; exp <= 8; exp += 1) {
      for (const mult of [1, 2, 5]) {
        const value = mult * Math.pow(10, exp);
        if (Math.log(value) >= yMin && Math.log(value) <= yMax) gridValues.push(value);
      }
    }

    const yearTicks: number[] = [];
    let year = new Date(xMin).getUTCFullYear() + 1;
    while (Date.UTC(year, 0, 1) < xMax) {
      yearTicks.push(Date.UTC(year, 0, 1));
      year += 1;
    }

    return { sx, sy, line, area, gridValues, yearTicks, plotH, last: points[points.length - 1] };
  }, [curve, width, height]);

  return (
    <View
      style={{ height }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {geometry ? (
        <>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.chartFillTop} />
                <Stop offset="1" stopColor={colors.chartFillBottom} />
              </LinearGradient>
            </Defs>

            {geometry.gridValues.map((value) => (
              <Line
                key={`g${value}`}
                x1={0}
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

            <Path d={geometry.area} fill="url(#curveFill)" />
            <Path
              d={geometry.line}
              stroke={colors.chartLine}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle
              cx={geometry.sx(geometry.last.t)}
              cy={geometry.sy(geometry.last.value)}
              r={3.2}
              fill={colors.chartLine}
            />
          </Svg>

          {geometry.gridValues.map((value) => (
            <Text
              key={`l${value}`}
              style={[styles.axis, tabular, { top: geometry.sy(value) - 7, right: 6 }]}
            >
              {value >= 1e6 ? `${value / 1e6}M` : `${value / 1e3}K`}
            </Text>
          ))}
          {geometry.yearTicks.map((t) => (
            <Text
              key={`x${t}`}
              style={[styles.axis, { left: Math.max(0, geometry.sx(t) - 16), bottom: 0 }]}
            >
              {axisDate(t)}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
};

/** Endpoints and provenance, sitting under the chart inside the padded block. */
export const ChartCaption = ({ curve }: { curve: EquityCurve }) => {
  if (curve.points.length < 2) return null;
  const first = curve.points[0];
  const last = curve.points[curve.points.length - 1];
  return (
    <View style={styles.caption}>
      <Text style={[styles.captionText, tabular]}>
        {wholeMoney(first.value)} → {wholeMoney(last.value)}
      </Text>
      <Text style={styles.captionText}>
        {curve.basis === 'marked' ? 'month-end closes' : 'endpoints exact, path modelled'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  axis: { position: 'absolute', fontSize: 10, color: colors.textTertiary },
  caption: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 2,
    gap: spacing.sm,
  },
  captionText: { fontSize: 11, color: colors.textTertiary, flexShrink: 1 },
});
