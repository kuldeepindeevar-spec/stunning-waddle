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
    thesis: 'Accelerated-compute standard. Core GPU exposure held since inception.',
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Software',
    thesis: 'AIP land-and-expand in US commercial. Largest software weight.',
  },
  VRT: {
    symbol: 'VRT',
    name: 'Vertiv Holdings Co',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Data Centre Infrastructure',
    thesis: 'Thermal and power picks-and-shovels for AI data centre buildout.',
  },
  MU: {
    symbol: 'MU',
    name: 'Micron Technology Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Memory',
    thesis: 'HBM supply is the binding constraint on accelerator shipments.',
  },
  APP: {
    symbol: 'APP',
    name: 'AppLovin Corp',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Software',
    thesis: 'Axon recommendation engine — machine learning applied to ad auctions.',
  },
  AVGO: {
    symbol: 'AVGO',
    name: 'Broadcom Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semiconductors',
    thesis: 'Custom accelerator (XPU) and AI networking franchise.',
  },
  ARM: {
    symbol: 'ARM',
    name: 'Arm Holdings plc ADR',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Semiconductors',
    thesis: 'Royalty on compute architecture; bought on the IPO cross.',
  },
  NBIS: {
    symbol: 'NBIS',
    name: 'Nebius Group N.V.',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Cloud',
    thesis: 'Neocloud GPU capacity bought on the Nasdaq relisting.',
  },
  CRWV: {
    symbol: 'CRWV',
    name: 'CoreWeave Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Cloud',
    thesis: 'Contracted GPU cloud backlog. Bought at the IPO close.',
  },
  SMCI: {
    symbol: 'SMCI',
    name: 'Super Micro Computer Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Hardware',
    thesis: 'Rack-scale integrator. Bought into strength; margin and filing risk since.',
  },
  SOUN: {
    symbol: 'SOUN',
    name: 'SoundHound AI Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'AI Software',
    thesis: 'Voice AI speculative sleeve. Entered on momentum, underwater since.',
  },
  AI: {
    symbol: 'AI',
    name: 'C3.ai Inc',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'AI Software',
    thesis: 'Enterprise AI applications. Legacy starter position, never averaged down.',
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
