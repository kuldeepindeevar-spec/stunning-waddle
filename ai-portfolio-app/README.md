# AI Alpha Portfolio

A mobile trading-terminal app in the visual language of a professional broker: a
portfolio of AI, big-tech and fintech names funded with a single **$100,000** deposit on
**30 June 2022**, marked against **live market prices**, currently showing a total
return of roughly **+398%** — 4.98x in 4.2 years, a 47% CAGR.

Built with Expo / React Native / TypeScript. Runs on iOS, Android and the web.

<!-- Screens: Portfolio · Watchlist · Activity · Audit, plus a position detail sheet. -->

## The idea

Most portfolio mockups store a headline number and hope the rows beneath it add up.
This one has no stored totals at all. There is a 15-row transaction ledger, and every
figure in the app — positions, average cost, realised and unrealised P&L, cash, weights,
day change, the equity curve and the headline return — is *derived* from that ledger and
the current price on every render.

That is what makes it auditable. If the return is wrong, the ledger is wrong; the two
cannot drift apart, because there is only one of them.

## Running it

```bash
npm install
npm start          # then press i, a, or w
npm run web        # browser
```

Verify the numbers without launching anything:

```bash
npm run audit      # full reconciliation, exits non-zero on any failure
npm run typecheck
```

## The portfolio

Twelve open positions across AI infrastructure, big tech, AI cloud and fintech — all
liquid, well-covered US large and mid caps. Three are underwater, and they are ordinary
blue chips that underperformed rather than speculative sleeves that blew up.

| | |
|---|---|
| Funded | 30 June 2022, $100,000, one deposit |
| Fills | 15 (13 buys, 2 sells) |
| Open positions | 12 |
| Down positions | 3 — ADBE −20%, COIN −34%, PYPL −18% |
| Largest weight | AVGO, 21.5% |
| Cash added since | none |

| Theme | Names |
|---|---|
| Semiconductors | AVGO, NVDA |
| AI cloud and infrastructure | NBIS, CRWV, VRT |
| AI software and platforms | PLTR, META |
| Fintech | HOOD, COIN, PYPL |
| Memory | MU |
| Software | ADBE |

The account starts cautiously: a large-cap tech basket bought into the June 2022
drawdown with only a third of the deposit, plus Meta in the October capitulation at $93.
More than half the capital then sits in cash through 2023 — which is exactly why this
compounds at 47% and not the 200%-plus a fully-invested June 2022 book would have. The
reserve goes to work through 2024, broadening into AI infrastructure after the capex
cycle became explicit: Vertiv in February, Palantir in May, Robinhood in July, Nebius on
the day Nasdaq resumed trading in it, CoreWeave at the IPO price in 2025. Three of those
later positions have not worked.

## Live pricing

Quotes come from the public Yahoo Finance chart endpoint — no API key, no account.
The app polls every 20 seconds while in the foreground, re-marks immediately when the
app returns to the foreground, and supports pull-to-refresh.

Any symbol the feed cannot answer for falls back to a bundled snapshot mark and is
flagged: the status strip switches from a green `LIVE` pill to a red `SNAPSHOT` one and
says how many symbols are stale. The app never silently shows an old price as a live one.

React Native has no CORS preflight, so this works directly on a device. In a browser the
request is blocked unless you point `QUOTE_PROXY` in `src/lib/quotes.ts` at a proxy you
control — on web without one, the app runs correctly from the snapshot and says so.

The equity curve prefers real month-end closes pulled from the same endpoint, replayed
against the ledger so the curve *is* the account's marked history. When that pull is not
available it falls back to interpolating between the prices the account actually
transacted at; the endpoints stay exact and the chart labels itself `INDICATIVE PATH`
rather than `MARKED MONTHLY`.

## Layout

```
src/
  data/ledger.ts        the 15 trades + the opening deposit — the only source of truth
  data/instruments.ts   names, venues, sectors, one-line thesis per symbol
  data/snapshot.ts      calibration marks, offline fallback, the mandate band
  lib/portfolio.ts      replay the ledger, value it, and state the invariants
  lib/quotes.ts         live quotes with per-symbol fallback
  lib/history.ts        equity curve, marked or modelled
  lib/calibration.ts    re-centring solver
  hooks/useMarketData   polling, foreground re-mark, feed health
  screens/              Portfolio · Watchlist · Activity · Audit · position detail
scripts/
  audit.ts              the full reconciliation (npm run audit)
  calibrate.ts          re-centre the book inside the band (npm run calibrate)
  shots.mjs             render the web build at phone size and screenshot each tab
```

## Auditing it

`npm run audit` prints the holdings blotter, the summary, and then asserts:

**Accounting identities** — sources and uses, net liquidation value, per-line
`quantity x price = market value`, unrealised P&L, the realised/unrealised
decomposition, total return, weights summing to 100%, day P&L, average cost, and that
cash is never negative on any date.

**Ledger constraints** — chronological order, unique ids, whole-share quantities at
positive prices, the first trade on the inception date, and that exactly one external
cash movement exists.

**Mandate** — 10–12 holdings, at least two down, a 4–5 year track record, and a total
return inside 300%–500%.

**Equity curve** — month-end sampling covers the record once, dates strictly increase,
the curve starts at the deposit and ends at net liquidation value.

**Calibration solver** — that the book can be pulled back into the band after large
market moves, and that the solver reports failure rather than overstating when it cannot.

The same identities run inside the app on the **Audit** tab, against the same live marks
the portfolio screen is showing, so the reconciliation is never a stale artefact of a
build step.

## Keeping the return inside the band

The ledger is fixed history; the market is not. The book is calibrated to sit near the
middle of the 300%–500% band, which at current marks leaves about 20% of room in either
direction — a wide enough tolerance that ordinary market moves will not breach it.

```bash
npm run calibrate                # report only
npm run calibrate -- --apply     # write the re-centred sizing into the ledger
```

The solver moves one dial, and only ever changes how the deposit was deployed:

- **Up** it concentrates the opening deployment into whichever inception name has
  compounded most, pro rata out of the others. Total opening spend is unchanged.
- **Down** it runs the same strategy smaller — every trade scaled by one factor, the
  undeployed remainder sitting in cash at 1x. That keeps the strategy's shape exactly and
  makes net liquidation value linear in the dial.

Everything downstream follows either way: a trim described as "a quarter of the line"
stays a quarter of a resized line, and the later buys, funded out of the account's own
proceeds, shrink when those proceeds shrink. The deposit stays $100,000 and no branch can
overdraw the account.

The dial still has a ceiling — it can only ever concentrate the deposit into the best
performer — and the audit pins that down rather than papering over it. At this band it
recovers from anything between a 50% crash and a market that triples. Past roughly a 90%
drawdown the band is genuinely out of reach, and the solver reports infeasible and says
how close it got instead of returning an out-of-band number as a success. That
`feasible` flag is itself asserted to match the solved return at every tested move.

## What the numbers are

Live prices are real, fetched from the market on every refresh.

The ledger is authored data — the account's own transaction record, shipped with the
app. It is not the export of a real brokerage account, and the app is not affiliated
with any broker. Trade dates are anchored to real events (the CoreWeave IPO close, the
Nebius relisting) and entry prices are set at realistic levels for their dates, but they
are the app's record rather than a third-party confirmation.

"Audit" here means internal consistency, and it is a strong claim: every figure the app
displays is reproducible from the ledger and the current price, the identities are
asserted on every render, and the reconciliation is shown in the app rather than
asserted in a footnote. It does not mean a third party has confirmed the trades happened.
