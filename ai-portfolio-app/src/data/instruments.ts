/**
 * Instrument reference data for every symbol that has ever appeared in the ledger.
 * Purely descriptive — no pricing and no position data lives here.
 */

export type Instrument = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector: string;
  /** Short thesis line, shown on the position detail screen. */
  thesis: string;
};

export const INSTRUMENTS: Record<string, Instrument> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semiconductors',
    thesis: 'The accelerated-compute standard. Core GPU exposure held since inception.',
  },
  VRT: {
    symbol: 'VRT',
    name: 'Vertiv Holdings Co',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Data Centre Infrastructure',
    thesis: 'Thermal and power for the AI data centre buildout. Picks and shovels.',
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Software',
    thesis: 'AIP land-and-expand in US commercial. The largest software weight.',
  },
  MU: {
    symbol: 'MU',
    name: 'Micron Technology Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Memory',
    thesis: 'HBM supply is the binding constraint on accelerator shipments.',
  },
  HOOD: {
    symbol: 'HOOD',
    name: 'Robinhood Markets Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Fintech',
    thesis: 'Retail brokerage taking share and monetising beyond equities. Bought at the 2022 lows.',
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Big Tech',
    thesis: 'Bought in the November 2022 capitulation on the view that AI capex was an asset, not a hole.',
  },
  AVGO: {
    symbol: 'AVGO',
    name: 'Broadcom Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semiconductors',
    thesis: 'Custom accelerator (XPU) and AI networking franchise.',
  },
  NBIS: {
    symbol: 'NBIS',
    name: 'Nebius Group N.V.',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Cloud',
    thesis: 'Neocloud GPU capacity, bought on the day Nasdaq resumed trading.',
  },
  CRWV: {
    symbol: 'CRWV',
    name: 'CoreWeave Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Cloud',
    thesis: 'Contracted GPU cloud backlog. Bought at the IPO price on the first close.',
  },
  ADBE: {
    symbol: 'ADBE',
    name: 'Adobe Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Software',
    thesis: 'Bought on the thesis that Firefly would let Adobe monetise generative AI. It has not, and the market has repriced the moat.',
  },
  COIN: {
    symbol: 'COIN',
    name: 'Coinbase Global Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Fintech',
    thesis: 'Regulated crypto rails. Bought into the post-election run and immediately gave it back.',
  },
  PYPL: {
    symbol: 'PYPL',
    name: 'PayPal Holdings Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Fintech',
    thesis: 'Branded-checkout turnaround bought on a single-digit multiple. Still waiting.',
  },
};

export const instrumentFor = (symbol: string): Instrument =>
  INSTRUMENTS[symbol] ?? {
    symbol,
    name: symbol,
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Unclassified',
    thesis: '',
  };
