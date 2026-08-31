/**
 * Live market data.
 *
 * Quotes come from the public Yahoo Finance chart endpoint, which needs no API
 * key and answers with the last trade plus the previous close. It is called
 * once per symbol; twelve requests is well inside any rate limit.
 *
 * React Native has no CORS preflight, so this works directly from a device. On
 * web the request is blocked by the browser unless QUOTE_PROXY is pointed at a
 * proxy you control — the app then falls back to the bundled snapshot and says
 * so in the header rather than showing nothing.
 */

import { SNAPSHOT, SNAPSHOT_AS_OF } from '../data/snapshot';
import type { Quote, QuoteMap } from './portfolio';

/** Optional CORS proxy prefix, e.g. 'https://my-proxy.example.com/?url='. */
export const QUOTE_PROXY = '';

const HOSTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
];

const REQUEST_TIMEOUT_MS = 8000;

export type QuoteFetchResult = {
  quotes: QuoteMap;
  /** Symbols that fell back to the bundled snapshot. */
  staleSymbols: Set<string>;
  /** True when every symbol is live. */
  live: boolean;
  asOf: Date;
  /** Present when the whole feed failed, for display in the status strip. */
  error?: string;
};

const withTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
};

type ChartMeta = {
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketTime?: number;
};

/** Fetch a single symbol. Resolves to null rather than throwing. */
export async function fetchQuote(symbol: string): Promise<Quote | null> {
  for (const host of HOSTS) {
    const target = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    try {
      const response = await withTimeout(QUOTE_PROXY ? QUOTE_PROXY + encodeURIComponent(target) : target);
      if (!response.ok) continue;
      const body = await response.json();
      const meta: ChartMeta | undefined = body?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) continue;
      const previousClose =
        typeof meta?.previousClose === 'number'
          ? meta.previousClose
          : typeof meta?.chartPreviousClose === 'number'
            ? meta.chartPreviousClose
            : price;
      return { price, previousClose };
    } catch {
      // Try the next host, then fall through to the snapshot.
    }
  }
  return null;
}

/**
 * Fetch every symbol in parallel. Any symbol that fails keeps its snapshot
 * mark and is reported in staleSymbols so the UI can flag it.
 */
export async function fetchQuotes(symbols: string[]): Promise<QuoteFetchResult> {
  const staleSymbols = new Set<string>();
  const quotes: QuoteMap = {};

  const settled = await Promise.all(
    symbols.map(async (symbol) => [symbol, await fetchQuote(symbol)] as const),
  );

  for (const [symbol, quote] of settled) {
    if (quote) {
      quotes[symbol] = quote;
    } else {
      const fallback = SNAPSHOT[symbol];
      if (!fallback) throw new Error(`no snapshot mark for ${symbol}`);
      quotes[symbol] = { ...fallback };
      staleSymbols.add(symbol);
    }
  }

  const live = staleSymbols.size === 0;
  return {
    quotes,
    staleSymbols,
    live,
    asOf: live ? new Date() : new Date(SNAPSHOT_AS_OF),
    error: staleSymbols.size === symbols.length ? 'Quote feed unreachable' : undefined,
  };
}

/** Snapshot-only quotes, used for the first paint before the feed answers. */
export function snapshotQuotes(symbols: string[]): QuoteFetchResult {
  const quotes: QuoteMap = {};
  for (const symbol of symbols) {
    const mark = SNAPSHOT[symbol];
    if (!mark) throw new Error(`no snapshot mark for ${symbol}`);
    quotes[symbol] = { ...mark };
  }
  return {
    quotes,
    staleSymbols: new Set(symbols),
    live: false,
    asOf: new Date(SNAPSHOT_AS_OF),
  };
}
