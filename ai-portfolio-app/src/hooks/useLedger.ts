/**
 * The working ledger: the shipped rows plus any orders placed in the app.
 *
 * Manual rows are persisted on the device and merged in date order. The
 * shipped ledger is never modified, so resetting always returns the account to
 * the record the app was built with.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRADES, Trade } from '../data/ledger';
import { applyOrder, isManual, OrderDraft } from '../lib/orders';
import type { QuoteMap } from '../lib/portfolio';

const STORAGE_KEY = 'portfolio.manualTrades.v1';

export type LedgerState = {
  /** Shipped rows plus manual ones, in date order. */
  trades: Trade[];
  manualCount: number;
  /** Throws with a readable reason if the order fails validation. */
  placeOrder: (quotes: QuoteMap, draft: OrderDraft) => void;
  reset: () => void;
  loaded: boolean;
};

const byDate = (rows: Trade[]) =>
  [...rows].sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

export function useLedger(): LedgerState {
  const [manual, setManual] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        // Only accept rows that still look like orders this app wrote.
        if (Array.isArray(parsed)) setManual(parsed.filter(isManual));
      })
      .catch(() => {
        // Storage is a convenience here; the shipped ledger still renders.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((rows: Trade[]) => {
    setManual(rows);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows)).catch(() => {});
  }, []);

  const trades = byDate([...TRADES, ...manual]);

  const placeOrder = useCallback(
    (quotes: QuoteMap, draft: OrderDraft) => {
      // applyOrder validates and throws; the caller shows the reason.
      const next = applyOrder(byDate([...TRADES, ...manual]), quotes, draft);
      persist(next.filter(isManual));
    },
    [manual, persist],
  );

  const reset = useCallback(() => persist([]), [persist]);

  return { trades, manualCount: manual.length, placeOrder, reset, loaded };
}
