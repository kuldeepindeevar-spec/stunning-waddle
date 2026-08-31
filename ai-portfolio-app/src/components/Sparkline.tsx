/**
 * A small chart of one holding's path since its first purchase.
 *
 * Built from the prices the ledger actually transacted at plus the current
 * mark, interpolated in log space between them. It is tinted by the
 * since-entry move rather than the day's — a line that falls over four years
 * should not be drawn in green because the position happens to be up today.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme';
import { interpolatedPriceAt, priceAnchors } from '../lib/history';
import type { QuoteMap } from '../lib/portfolio';

const WIDTH = 62;
const HEIGHT = 30;
const PAD = 3;
const SAMPLES = 24;

export const Sparkline = ({
  symbol,
  quotes,
  direction,
  now = Date.now(),
}: {
  symbol: string;
  quotes: QuoteMap;
  /** Sign of the since-entry move. */
  direction: number;
  now?: number;
}) => {
  const anchors = priceAnchors(quotes, now);
  const list = anchors[symbol];
  if (!list || list.length < 2) return <Svg width={WIDTH} height={HEIGHT} />;

  const t0 = list[0].t;
  const values: number[] = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const t = t0 + ((now - t0) * i) / (SAMPLES - 1);
    const value = interpolatedPriceAt(anchors, symbol, t);
    if (value == null) return <Svg width={WIDTH} height={HEIGHT} />;
    values.push(value);
  }

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const line = values
    .map((value, i) => {
      const x = (i / (SAMPLES - 1)) * WIDTH;
      const y = PAD + (HEIGHT - PAD * 2) * (1 - (value - lo) / span);
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const tint = direction > 0 ? colors.gain : direction < 0 ? colors.loss : colors.flat;

  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <Path d={area} fill={tint} fillOpacity={0.13} />
      <Path
        d={line}
        fill="none"
        stroke={tint}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};
