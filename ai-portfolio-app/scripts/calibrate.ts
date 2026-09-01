/**
 * Re-centre the portfolio inside the mandate band.
 *
 * The book is calibrated to the middle of the band, but the market keeps
 * moving and will eventually push it out. This prices the book and, if the
 * return has left the band, prints the exact ledger edit that puts it back.
 *
 *   npm run calibrate                 # live prices, snapshot fallback
 *   npm run calibrate -- --snapshot   # force the bundled snapshot
 *   npm run calibrate -- --apply      # write the change into ledger.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { TRADES } from '../src/data/ledger';
import { RETURN_BAND, SNAPSHOT } from '../src/data/snapshot';
import { buildPortfolio, QuoteMap } from '../src/lib/portfolio';
import { solveBallast } from '../src/lib/calibration';
import { fetchQuotes } from '../src/lib/quotes';

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const args = process.argv.slice(2);
const useSnapshot = args.includes('--snapshot');
const apply = args.includes('--apply');

const symbolsHeld = (): string[] => {
  const held = new Map<string, number>();
  for (const trade of TRADES) {
    held.set(
      trade.symbol,
      (held.get(trade.symbol) ?? 0) + (trade.side === 'BUY' ? trade.quantity : -trade.quantity),
    );
  }
  return [...held.entries()].filter(([, q]) => q > 0).map(([s]) => s);
};

async function main() {
  const symbols = symbolsHeld();

  let quotes: QuoteMap;
  let source: string;
  if (useSnapshot) {
    quotes = Object.fromEntries(symbols.map((s) => [s, { ...SNAPSHOT[s] }]));
    source = 'bundled snapshot';
  } else {
    const feed = await fetchQuotes(symbols);
    quotes = feed.quotes;
    source =
      feed.staleSymbols.size === 0
        ? 'live quotes'
        : `live quotes (${feed.staleSymbols.size} of ${symbols.length} fell back to snapshot)`;
  }

  const baseline = buildPortfolio(quotes).summary;

  console.log('CALIBRATION');
  console.log(`  Price source        ${source}`);
  console.log(`  Net liquidation     ${usd(baseline.netLiquidation)}`);
  console.log(`  Total return        ${baseline.totalReturnPct.toFixed(2)}%`);
  console.log(`  Mandate band        ${RETURN_BAND.min}% - ${RETURN_BAND.max}%`);

  if (
    baseline.totalReturnPct >= RETURN_BAND.min &&
    baseline.totalReturnPct <= RETURN_BAND.max
  ) {
    console.log('\n  In band. No change needed.');
    return;
  }

  console.log('\n  Out of band — solving for the nearest ballast sizing…');
  const solution = solveBallast(quotes, RETURN_BAND);

  if (!solution.feasible) {
    console.log(
      `\n  Best reachable return is ${solution.returnPct.toFixed(2)}%, still outside the band.\n` +
        '  The market has moved further than the cash-funded levers can absorb.\n' +
        '  Widen RETURN_BAND, or add another late cash-funded trade to BALLAST_IDS.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`  Solved return       ${solution.returnPct.toFixed(2)}%`);

  const entries = Object.entries(solution.changes);
  if (entries.length === 0) {
    console.log('\n  Current sizing is already the closest available.');
    return;
  }

  console.log('\n  Apply to src/data/ledger.ts:');
  for (const [id, change] of entries) {
    console.log(`    ${id}  ${change.symbol.padEnd(5)} quantity ${change.from} -> ${change.to}`);
  }

  if (!apply) {
    console.log('\n  Re-run with --apply to write these quantities into the ledger.');
    return;
  }

  const path = resolve(__dirname, '../src/data/ledger.ts');
  let text = readFileSync(path, 'utf8');
  for (const [id, change] of entries) {
    const pattern = new RegExp(`(id: '${id}',[\\s\\S]*?quantity: )${change.from}(,)`);
    if (!pattern.test(text)) {
      console.log(`\n  Could not locate ${id} in ledger.ts — apply the edit by hand.`);
      process.exitCode = 1;
      return;
    }
    text = text.replace(pattern, `$1${change.to}$2`);
  }
  writeFileSync(path, text);
  console.log('\n  Written. Run `npm run audit` to confirm.');
}

void main();
