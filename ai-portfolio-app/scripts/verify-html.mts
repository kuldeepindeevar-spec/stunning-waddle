/**
 * Verify the standalone iPhone build against the React Native build.
 *
 * The HTML app carries its own copy of the ledger and the engine, so the two
 * could silently drift apart. This loads the real file in a browser at iPhone
 * size, runs the page's own engine against its own bundled snapshot marks, and
 * asserts every figure matches the TypeScript engine — position by position —
 * plus the accounting identities, the mandate and the iOS shell.
 *
 *   npm run verify:html
 *   npx tsx scripts/verify-html.ts ../ai-portfolio.html ./shots
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { INITIAL_CAPITAL, TRADES } from '../src/data/ledger';
import { RETURN_BAND, SNAPSHOT, SNAPSHOT_AS_OF } from '../src/data/snapshot';
import { buildPortfolio, checkInvariants } from '../src/lib/portfolio';

const htmlPath = resolve(
  process.argv[2] ?? fileURLToPath(new URL('../../ai-portfolio.html', import.meta.url)),
);
const shotDir = process.argv[3] ?? null;

const failures: string[] = [];
const check = (ok: boolean, label: string, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};
const near = (a: number, b: number, tol = 0.005) => Math.abs(a - b) <= tol;

/** The reference: the same engine the native app and `npm run audit` use. */
const reference = buildPortfolio(SNAPSHOT, { asOf: new Date(SNAPSHOT_AS_OF) });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
// iPhone 15 Pro viewport, so layout problems show up at the size they matter.
const page = await browser.newPage({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const pageErrors: string[] = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pageErrors.push(m.text());
});

await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.waitForTimeout(1500);

console.log('='.repeat(74));
console.log('STANDALONE HTML BUILD — PARITY CHECK');
console.log(`file ${htmlPath}`);
console.log('='.repeat(74));

/**
 * Run the page's own engine against its own snapshot marks, through the
 * AIAP handle the page exposes — so the page's names cannot collide with the
 * identically-named imports in this script.
 */
const actual = await page.evaluate(() => {
  const g = (window as any).AIAP;
  const feed = g.snapshotQuotes();
  const asOf = new Date(g.SNAPSHOT_AS_OF);
  const pf = g.buildPortfolio(feed.quotes, feed.stale, asOf);
  const curve = g.buildModelledCurve(feed.quotes, asOf.getTime()).points;
  return {
    summary: pf.summary,
    positions: pf.positions.map((p: any) => ({
      sym: p.sym, qty: p.qty, avg: p.avg, cost: p.cost, price: p.price,
      marketValue: p.marketValue, unrealized: p.unrealized,
      unrealizedPct: p.unrealizedPct, weight: p.weight, realized: p.realized,
    })),
    invariants: g.checkInvariants(pf).map((i: any) => ({ name: i.name, passed: i.passed })),
    tradeCount: g.TRADES.length,
    curvePoints: curve.length,
    curveFirst: curve[0].value,
    curveLast: curve[curve.length - 1].value,
  };
});

console.log('\nRUNTIME');
check(pageErrors.length === 0, 'Page loads with no script errors', pageErrors.join(' | ') || 'clean');

console.log('\nLEDGER PARITY');
check(actual.tradeCount === TRADES.length, 'Same trade count',
  `${actual.tradeCount} vs ${TRADES.length}`);
check(actual.positions.length === reference.positions.length, 'Same position count',
  `${actual.positions.length} vs ${reference.positions.length}`);

console.log('\nPER-POSITION PARITY');
for (const ref of reference.positions) {
  const got = actual.positions.find((p: any) => p.sym === ref.symbol);
  if (!got) {
    check(false, `${ref.symbol} present in the HTML build`);
    continue;
  }
  const ok =
    got.qty === ref.quantity &&
    near(got.avg, ref.averageCost, 1e-6) &&
    near(got.cost, ref.costBasis) &&
    near(got.price, ref.price, 1e-9) &&
    near(got.marketValue, ref.marketValue) &&
    near(got.unrealized, ref.unrealizedPnl) &&
    near(got.unrealizedPct, ref.unrealizedPct, 1e-6) &&
    near(got.realized, ref.realizedPnl) &&
    near(got.weight, ref.weight, 1e-9);
  check(ok, `${ref.symbol.padEnd(5)} matches`,
    `${got.qty} @ ${got.avg.toFixed(4)} = ${got.marketValue.toFixed(2)} (${got.unrealizedPct.toFixed(2)}%)`);
}

console.log('\nSUMMARY PARITY');
const pairs: [string, number, number][] = [
  ['Net liquidation value', actual.summary.netLiquidation, reference.summary.netLiquidation],
  ['Securities value', actual.summary.securities, reference.summary.securitiesValue],
  ['Settled cash', actual.summary.cash, reference.summary.cash],
  ['Open cost basis', actual.summary.openCost, reference.summary.openCostBasis],
  ['Unrealised P&L', actual.summary.unrealizedPnl, reference.summary.unrealizedPnl],
  ['Realised P&L', actual.summary.realizedPnl, reference.summary.realizedPnl],
  ['Total P&L', actual.summary.totalPnl, reference.summary.totalPnl],
  ['Total return %', actual.summary.totalReturnPct, reference.summary.totalReturnPct],
  ['Day P&L', actual.summary.dayPnl, reference.summary.dayPnl],
  ['CAGR %', actual.summary.cagrPct, reference.summary.cagrPct],
  ['Years held', actual.summary.years, reference.summary.yearsHeld],
];
for (const [label, got, want] of pairs) {
  check(near(got, want, 1e-6), label, `${got.toFixed(6)} vs ${want.toFixed(6)}`);
}

console.log('\nIDENTITIES EVALUATED INSIDE THE PAGE');
const refInvariants = checkInvariants(reference);
check(actual.invariants.length === refInvariants.length, 'Same identity count',
  `${actual.invariants.length} vs ${refInvariants.length}`);
for (const inv of actual.invariants) check(inv.passed, inv.name);

console.log('\nEQUITY CURVE');
check(actual.curvePoints >= 48 && actual.curvePoints <= 56,
  'Month-end sampling covers the record once', `${actual.curvePoints} points`);
check(near(actual.curveFirst, INITIAL_CAPITAL, 1),
  'Curve starts at the opening deposit', actual.curveFirst.toFixed(2));
check(near(actual.curveLast, reference.summary.netLiquidation),
  'Curve ends at net liquidation value', actual.curveLast.toFixed(2));

console.log('\nMANDATE');
check(
  actual.summary.totalReturnPct >= RETURN_BAND.min &&
    actual.summary.totalReturnPct <= RETURN_BAND.max,
  `Total return within ${RETURN_BAND.min}%-${RETURN_BAND.max}%`,
  `${actual.summary.totalReturnPct.toFixed(2)}%`,
);
check(actual.summary.losers >= 2, 'Portfolio contains losing positions',
  `${actual.summary.losers} down, ${actual.summary.winners} up`);

console.log('\niPHONE SHELL');
const shell = await page.evaluate(() => {
  // Inlined rather than pulled into a named helper: esbuild instruments named
  // inner functions with a __name shim that does not exist in the page.
  const metas: Record<string, string> = {};
  for (const m of Array.from(document.querySelectorAll('meta[name]'))) {
    metas[m.getAttribute('name') as string] = m.getAttribute('content') ?? '';
  }
  const doc = document.documentElement;
  return {
    webApp: metas['apple-mobile-web-app-capable'] ?? '',
    statusBar: metas['apple-mobile-web-app-status-bar-style'] ?? '',
    viewport: metas['viewport'] ?? '',
    title: metas['apple-mobile-web-app-title'] ?? '',
    icon: !!document.querySelector('link[rel="apple-touch-icon"]'),
    horizontalScroll: doc.scrollWidth > doc.clientWidth,
    tabs: document.querySelectorAll('#tabs .tab').length,
    rows: document.querySelectorAll('#sheet [data-sym]').length,
    externalRefs: Array.from(
      document.querySelectorAll('script[src], link[href], img[src]'),
    ).length,
  };
});
check(shell.webApp === 'yes', 'Declares itself a home-screen web app');
check(shell.statusBar === 'black-translucent', 'Status bar style set for the dark UI');
check(/viewport-fit=cover/.test(shell.viewport), 'Viewport covers the safe areas');
check(shell.title === 'AI Alpha', 'Home-screen name set', shell.title);
check(shell.icon, 'Home-screen icon generated at runtime');
check(!shell.horizontalScroll, 'No horizontal overflow at 393px');
check(shell.tabs === 4, 'Four tabs rendered', String(shell.tabs));
check(shell.rows === reference.positions.length, 'Blotter renders every position',
  String(shell.rows));
// One document, no network dependency for the UI: the only external ref the
// page may hold is the runtime-generated icon, whose href is a data URI.
check(shell.externalRefs <= 1, 'Self-contained — no external assets',
  `${shell.externalRefs} ref(s)`);

// Tap targets: anything tappable should clear roughly the 44pt guideline, or
// it is a mis-tap waiting to happen on a phone.
const smallTargets = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#tabs .tab, #sheet [data-sym]'))
    .map((el) => ({ t: el.textContent!.trim().slice(0, 12), h: el.getBoundingClientRect().height }))
    .filter((x) => x.h < 40));
check(smallTargets.length === 0, 'Tap targets are at least 40px tall',
  smallTargets.map((s) => `${s.t}:${s.h.toFixed(0)}`).join(',') || 'all pass');

// Every label is built by string concatenation, so a label that arrives at
// esc() already escaped renders as "P&AMP;L". Cheap to check, easy to miss.
console.log('\nTEXT RENDERING');
for (const tab of ['Portfolio', 'Watchlist', 'Activity', 'Audit']) {
  await page.getByText(tab, { exact: true }).last().click();
  await page.waitForTimeout(250);
  const bad = await page.evaluate(() => {
    const text = document.getElementById('sheet')!.innerText;
    return ['&amp;', '&lt;', '&gt;', '&quot;', 'undefined', 'NaN', 'Infinity']
      .filter((token) => text.includes(token));
  });
  check(bad.length === 0, `${tab} renders no escaping or numeric artefacts`,
    bad.join(',') || 'clean');
}

// A label/value row that falls outside its scoped selector loses
// space-between and renders as "Target1800%". Assert the gap survives.
await page.getByText('Audit', { exact: true }).last().click();
await page.waitForTimeout(250);
const collided = await page.evaluate(() => {
  const text = document.getElementById('sheet')!.innerText;
  return [/Target\S/, /Actual[+\-]/, /deposit\d/, /cash\d/]
    .filter((re) => re.test(text))
    .map((re) => re.source);
});
check(collided.length === 0, 'Label and value stay separated in every row',
  collided.join(',') || 'clean');

// Rotation: the chart viewBox is sized to the viewport, so a width change has
// to repaint rather than leave a stretched or clipped path behind.
await page.getByText('Portfolio', { exact: true }).last().click();
await page.setViewportSize({ width: 852, height: 393 });
await page.waitForTimeout(500);
const landscape = await page.evaluate(() => {
  const wrap = document.getElementById('chartwrap');
  const svg = wrap?.querySelector('svg');
  const vb = svg?.getAttribute('viewBox')?.split(' ') ?? [];
  return {
    viewBoxWidth: Number(vb[2] ?? 0),
    // The chart lives inside an inset card, so it is measured against its own
    // container rather than the viewport — that stays true if the card's
    // margins ever change.
    containerWidth: wrap ? Math.round(wrap.getBoundingClientRect().width) : 0,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
});
check(Math.abs(landscape.viewBoxWidth - landscape.containerWidth) <= 1,
  'Chart repaints to the new width on rotation',
  `viewBox ${landscape.viewBoxWidth} vs container ${landscape.containerWidth}`);
check(!landscape.overflow, 'No horizontal overflow in landscape');
await page.setViewportSize({ width: 393, height: 852 });
await page.waitForTimeout(400);

console.log('\nNAVIGATION');
for (const tab of ['Watchlist', 'Activity', 'Audit', 'Portfolio']) {
  await page.getByText(tab, { exact: true }).last().click();
  await page.waitForTimeout(250);
  const filled = await page.evaluate(() =>
    (document.getElementById('sheet')!.textContent ?? '').trim().length);
  check(filled > 200, `${tab} tab renders`, `${filled} chars`);
}
await page.getByText('NVDA', { exact: true }).last().click();
await page.waitForTimeout(300);
const detailOk = await page.evaluate(() => {
  const t = document.getElementById('sheet')!.textContent ?? '';
  return t.includes('NVIDIA Corp') && t.includes('Average cost') && t.includes('Trades (');
});
check(detailOk, 'Position detail opens from the blotter');
await page.getByText('Portfolio', { exact: true }).first().click();
await page.waitForTimeout(300);
const backOk = await page.evaluate(() =>
  (document.getElementById('sheet')!.textContent ?? '').includes('Total Assets'));
check(backOk, 'Back returns to the portfolio');

if (shotDir) {
  mkdirSync(shotDir, { recursive: true });
  for (const tab of ['Portfolio', 'Watchlist', 'Activity', 'Audit']) {
    await page.getByText(tab, { exact: true }).last().click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${shotDir}/${tab.toLowerCase()}.png` });
  }
  await page.getByText('Portfolio', { exact: true }).last().click();
  await page.waitForTimeout(250);
  await page.evaluate(() => { document.getElementById('scroller')!.scrollTop = 1500; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shotDir}/blotter.png` });
  console.log(`\nScreenshots written to ${shotDir}`);
}

await browser.close();

console.log('\n' + '='.repeat(74));
if (failures.length) {
  console.log(`PARITY CHECK FAILED — ${failures.length} check(s): ${failures.join(', ')}`);
  process.exit(1);
}
console.log('PARITY CHECK PASSED — the HTML build reports exactly the native figures.');
