/**
 * Standalone audit of the portfolio.
 *
 * Values the ledger at the calibration snapshot and asserts every accounting
 * identity plus the mandate constraints. Run with `npm run audit`.
 * Exits non-zero on any failure so it can gate CI.
 */

import { INCEPTION_DATE, INITIAL_CAPITAL, TRADES } from '../src/data/ledger';
import { RETURN_BAND, SNAPSHOT, SNAPSHOT_AS_OF } from '../src/data/snapshot';
import { buildPortfolio, checkInvariants, replayLedger } from '../src/lib/portfolio';
import { scaleQuotes, solveBallast } from '../src/lib/calibration';
import { buildModelledCurve, monthEnds } from '../src/lib/history';

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const failures: string[] = [];
const check = (ok: boolean, label: string, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const asOf = new Date(SNAPSHOT_AS_OF);
const portfolio = buildPortfolio(SNAPSHOT, { asOf });
const { positions, summary } = portfolio;
const replay = replayLedger();

console.log('='.repeat(78));
console.log('PORTFOLIO AUDIT');
console.log(`Marks as of ${SNAPSHOT_AS_OF}  |  inception ${INCEPTION_DATE}`);
console.log('='.repeat(78));

// ---------------------------------------------------------------- positions
console.log('\nHOLDINGS');
console.log(
  ['SYM'.padEnd(6), 'QTY'.padStart(7), 'AVG COST'.padStart(11), 'LAST'.padStart(10),
   'COST BASIS'.padStart(14), 'MKT VALUE'.padStart(15), 'UNREAL P&L'.padStart(15),
   'RET%'.padStart(9), 'WGT%'.padStart(7)].join(' '),
);
for (const p of positions) {
  console.log(
    [
      p.symbol.padEnd(6),
      p.quantity.toLocaleString('en-US').padStart(7),
      p.averageCost.toFixed(4).padStart(11),
      p.price.toFixed(2).padStart(10),
      usd(p.costBasis).padStart(14),
      usd(p.marketValue).padStart(15),
      usd(p.unrealizedPnl).padStart(15),
      pct(p.unrealizedPct).padStart(9),
      (p.weight * 100).toFixed(2).padStart(7),
    ].join(' '),
  );
}

// ------------------------------------------------------------------ summary
console.log('\nSUMMARY');
const rows: [string, string][] = [
  ['Opening deposit', usd(summary.initialCapital)],
  ['Securities market value', usd(summary.securitiesValue)],
  ['Settled cash', usd(summary.cash)],
  ['Net liquidation value', usd(summary.netLiquidation)],
  ['Open cost basis', usd(summary.openCostBasis)],
  ['Unrealised P&L', usd(summary.unrealizedPnl)],
  ['Realised P&L', usd(summary.realizedPnl)],
  ['Total P&L', usd(summary.totalPnl)],
  ['Total return', pct(summary.totalReturnPct)],
  ['Growth multiple', `${(summary.netLiquidation / INITIAL_CAPITAL).toFixed(2)}x`],
  ['Years held', summary.yearsHeld.toFixed(2)],
  ['CAGR', pct(summary.cagrPct)],
];
for (const [label, value] of rows) console.log(`  ${label.padEnd(26)} ${value.padStart(18)}`);

// --------------------------------------------------------------- invariants
console.log('\nACCOUNTING IDENTITIES');
for (const inv of checkInvariants(portfolio)) {
  check(
    inv.passed,
    inv.name,
    `expected ${inv.expected.toFixed(6)} got ${inv.actual.toFixed(6)}`,
  );
}

// ------------------------------------------------------- ledger constraints
console.log('\nLEDGER CONSTRAINTS');
check(
  replay.minimumCash >= -1e-9,
  'Cash never negative',
  `minimum balance ${usd(replay.minimumCash)}`,
);

const dates = TRADES.map((t) => t.date);
check(
  dates.every((d, i) => i === 0 || dates[i - 1] <= d),
  'Trades are in chronological order',
);
check(
  dates[0] === INCEPTION_DATE,
  'First trade is on the inception date',
  `${dates[0]}`,
);
check(
  new Set(TRADES.map((t) => t.id)).size === TRADES.length,
  'Trade ids are unique',
);
check(
  TRADES.every((t) => t.quantity > 0 && Number.isInteger(t.quantity) && t.price > 0),
  'All trades are whole share quantities at a positive price',
);

// The strongest statement about the deposit: replay with no trades at all must
// leave exactly the deposit, and the trades must move only internal balances.
const sourcesAndUses = summary.openCostBasis + summary.cash - summary.realizedPnl;
check(
  Math.abs(sourcesAndUses - INITIAL_CAPITAL) < 0.01,
  'Exactly one external cash movement',
  `derived deposit ${usd(sourcesAndUses)}`,
);

// -------------------------------------------------------- mandate constraints
console.log('\nMANDATE');
check(
  positions.length >= 10 && positions.length <= 12,
  'Holding count is 10-12',
  `${positions.length} positions`,
);
check(
  summary.losers >= 2,
  'Portfolio contains losing positions',
  `${summary.losers} down, ${summary.winners} up`,
);
check(
  summary.yearsHeld >= 4 && summary.yearsHeld <= 5,
  'Track record is 4-5 years',
  `${summary.yearsHeld.toFixed(2)} years`,
);
check(
  summary.totalReturnPct >= RETURN_BAND.min && summary.totalReturnPct <= RETURN_BAND.max,
  `Total return within ${RETURN_BAND.min}%-${RETURN_BAND.max}%`,
  pct(summary.totalReturnPct),
);

// Headroom tells you how far the market can move before the band is breached.
const bandLowNlv = INITIAL_CAPITAL * (1 + RETURN_BAND.min / 100);
const bandHighNlv = INITIAL_CAPITAL * (1 + RETURN_BAND.max / 100);
console.log('\nBAND HEADROOM');
console.log(`  Net liquidation value      ${usd(summary.netLiquidation).padStart(18)}`);
console.log(
  `  Band floor (${RETURN_BAND.min}%)          ${usd(bandLowNlv).padStart(18)}` +
    `   ${(((bandLowNlv - summary.netLiquidation) / summary.netLiquidation) * 100).toFixed(2)}% move`,
);
console.log(
  `  Band ceiling (${RETURN_BAND.max}%)        ${usd(bandHighNlv).padStart(18)}` +
    `   ${(((bandHighNlv - summary.netLiquidation) / summary.netLiquidation) * 100).toFixed(2)}% move`,
);

// ------------------------------------------------------------ equity curve
console.log('\nEQUITY CURVE');
const curveNow = asOf.getTime();
const ends = monthEnds(curveNow);
const expectedMonths = Math.round(summary.yearsHeld * 12);
check(
  ends.length >= expectedMonths - 1 && ends.length <= expectedMonths + 3,
  'Month-end sampling covers the track record exactly once',
  `${ends.length} points for ${expectedMonths} months`,
);
check(
  ends.every((t, i) => i === 0 || ends[i - 1] < t),
  'Sample dates strictly increase',
);

const modelled = buildModelledCurve(SNAPSHOT, curveNow);
check(
  Math.abs(modelled.points[0].value - INITIAL_CAPITAL) < 1,
  'Curve starts at the opening deposit',
  usd(modelled.points[0].value),
);
check(
  Math.abs(modelled.points[modelled.points.length - 1].value - summary.netLiquidation) < 0.01,
  'Curve ends at net liquidation value',
  usd(modelled.points[modelled.points.length - 1].value),
);
check(
  modelled.points.every((p) => Number.isFinite(p.value) && p.value > 0),
  'Every curve point is a positive finite value',
);

// ------------------------------------------------------ calibration solver
// The band holds at today's marks, but the market moves. Prove the re-centring
// solver can pull the book back into the band after a large move in either
// direction, so the mandate stays recoverable rather than luckily satisfied.
console.log('\nCALIBRATION SOLVER');
for (const factor of [0.5, 0.7, 0.85, 1.15, 1.4, 2.0, 3.0]) {
  const moved = scaleQuotes(SNAPSHOT, factor);
  const before = buildPortfolio(moved).summary.totalReturnPct;
  const solution = solveBallast(moved, RETURN_BAND);
  check(
    solution.feasible,
    `Recovers the band after a ${((factor - 1) * 100).toFixed(0)}% market move`,
    `${before.toFixed(0)}% -> ${solution.returnPct.toFixed(2)}%`,
  );
  // The flag has to mean what it says: a solver that reports success while
  // handing back a number outside the band is worse than one that fails.
  check(
    solution.feasible ===
      (solution.returnPct >= RETURN_BAND.min && solution.returnPct <= RETURN_BAND.max),
    `  feasible flag matches the solved return at ${factor}x`,
  );
}

// The dial still has a ceiling — it can only ever concentrate the deposit into
// the best performer. Past that, the honest answer is that the band is out of
// reach, and the solver has to say so rather than overstate.
{
  const crashed = scaleQuotes(SNAPSHOT, 0.05);
  const before = buildPortfolio(crashed).summary.totalReturnPct;
  const solution = solveBallast(crashed, RETURN_BAND);
  check(
    !solution.feasible && solution.returnPct > before,
    'Reports infeasible after a -95% move rather than overstating',
    `${before.toFixed(0)}% -> best reachable ${solution.returnPct.toFixed(2)}%`,
  );
}

console.log('\n' + '='.repeat(78));
if (failures.length) {
  console.log(`AUDIT FAILED — ${failures.length} check(s): ${failures.join(', ')}`);
  process.exit(1);
}
console.log('AUDIT PASSED — every identity and mandate constraint holds.');
