/**
 * Owns every piece of live state: quotes, the equity curve, refresh timing and
 * feed health. Screens read the derived portfolio and never fetch themselves.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { TRADES, Trade } from '../data/ledger';
import { buildPortfolio, Portfolio } from '../lib/portfolio';
import { fetchQuotes, snapshotQuotes, QuoteFetchResult } from '../lib/quotes';
import {
  buildCurveFromHistory,
  buildModelledCurve,
  EquityCurve,
  fetchMonthlyHistory,
} from '../lib/history';

/** How often the quote feed is polled while the app is in the foreground. */
export const REFRESH_INTERVAL_MS = 20_000;

/**
 * Every symbol the account has ever traded, not just the ones currently held.
 * Selling a line to zero must not stop its quote, or the position could never
 * be re-opened from the watchlist.
 */
export const SYMBOLS = [...new Set(TRADES.map((trade) => trade.symbol))];

export type MarketData = {
  portfolio: Portfolio;
  curve: EquityCurve;
  feed: QuoteFetchResult;
  refreshing: boolean;
  lastUpdated: Date;
  refresh: () => void;
};

export function useMarketData(trades: Trade[] = TRADES): MarketData {
  const [feed, setFeed] = useState<QuoteFetchResult>(() => snapshotQuotes(SYMBOLS));
  const [curve, setCurve] = useState<EquityCurve>(() =>
    buildModelledCurve(snapshotQuotes(SYMBOLS).quotes),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const inFlight = useRef(false);
  const historyLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const next = await fetchQuotes(SYMBOLS);
      setFeed(next);
      setLastUpdated(new Date());

      // The marked curve needs one history pull; after that only the final
      // point moves, which the modelled tail already handles.
      if (!historyLoaded.current && next.live) {
        const history = await fetchMonthlyHistory(SYMBOLS);
        if (Object.keys(history).length === SYMBOLS.length) {
          const marked = buildCurveFromHistory(history);
          if (marked.points.length > 2) {
            setCurve(marked);
            historyLoaded.current = true;
            return;
          }
        }
      }
      if (!historyLoaded.current) setCurve(buildModelledCurve(next.quotes));
    } catch {
      // Keep the previous marks; the status strip already shows staleness.
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  // Initial load plus a foreground poll.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Re-mark immediately when the app comes back to the foreground.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [refresh]);

  const portfolio = buildPortfolio(feed.quotes, { staleSymbols: feed.staleSymbols, trades });

  return { portfolio, curve, feed, refreshing, lastUpdated, refresh: () => void refresh() };
}
