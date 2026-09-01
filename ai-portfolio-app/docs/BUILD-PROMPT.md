# Build prompt: a phone portfolio terminal

Paste everything below into a capable coding model. It is written to be built
in one pass, and it front-loads the decisions that are expensive to discover
late — the return-target arithmetic, the accounting invariants, and a list of
specific defects that are easy to ship and hard to notice.

---

## 1. What to build

A mobile portfolio app in the visual language of a modern retail broker,
showing one investment account against **live market prices**.

Ship it in two forms from one specification:

1. **A single self-contained HTML file** — inline CSS and vanilla JS, no build
   step, no external assets, designed to be added to an iPhone home screen.
2. **An Expo / React Native / TypeScript app** — iOS, Android and web.

Both must produce **identical figures** from identical inputs, and you must
write a script that proves it rather than asserting it.

---

## 2. The one architectural rule

**There are no stored totals. Anywhere.**

The app holds a chronological ledger of trades. Positions, average cost, cost
basis, realised P&L, cash, market value, unrealised P&L, weights, day change,
the equity curve and the headline return are all *derived* from that ledger and
the current prices, recomputed on every render.

Never cache a total, never write a computed figure back into state, never let
two code paths compute the same number differently. If the headline return is
wrong, the ledger must be wrong — because there is only one of them.

This is what makes the app auditable, and every later requirement depends on it.

---

## 3. Data model

```ts
type Trade = {
  id: string;          // 'T001' shipped, 'M001' entered in the app
  date: string;        // ISO yyyy-mm-dd
  side: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;    // whole shares, > 0
  price: number;       // per share, USD, split-adjusted
  note: string;        // why the trade was done — shown in the statement
};

type Instrument = {
  symbol, name, exchange, currency, sector, thesis: string;
};

type Quote = { price: number; previousClose: number };
```

Constants: `INCEPTION_DATE`, `INITIAL_CAPITAL = 100_000`, an `ACCOUNT`
descriptor, and a `RETURN_BAND = { min, max }` target range.

---

## 4. The engine

### 4.1 Replay

Sort trades by `date`, then by `id` so the result never depends on source
ordering. Walk them keeping, per symbol: quantity, cost basis, average cost,
realised P&L; and globally: settled cash and the **minimum cash ever seen**.

Use **average-cost** basis, which is what a US broker reports by default:

- **BUY** — `quantity += q`, `costBasis += q * price`, `cash -= q * price`
- **SELL** — `basisOut = averageCost * q`, `realised += q * price - basisOut`,
  `quantity -= q`, `costBasis -= basisOut`, `cash += q * price`
- after either: `averageCost = quantity > 0 ? costBasis / quantity : 0`

Throw if a sell exceeds shares held.

### 4.2 Valuation

For each open lot, given a quote:

```
marketValue    = quantity * price
unrealisedPnl  = marketValue - costBasis
unrealisedPct  = unrealisedPnl / costBasis * 100
dayChange      = price - previousClose
dayPnl         = dayChange * quantity
weight         = marketValue / netLiquidation
```

Account level:

```
securitiesValue = Σ marketValue
netLiquidation  = securitiesValue + cash
openCostBasis   = Σ costBasis
unrealisedPnl   = securitiesValue - openCostBasis
totalPnl        = netLiquidation - INITIAL_CAPITAL
totalReturnPct  = totalPnl / INITIAL_CAPITAL * 100
growth          = netLiquidation / INITIAL_CAPITAL
yearsHeld       = (now - inception) / 365.25 days
cagrPct         = (growth ** (1 / yearsHeld) - 1) * 100
```

Weights are a share of **net liquidation value**, so cash is in the denominator
and position weights deliberately sum to slightly under 100%.

---

## 5. The invariants

Write one function, `checkInvariants(portfolio)`, returning a list of
`{ name, detail, expected, actual, passed }`. It is called by **both** the
command-line audit and an in-app screen, so the two can never disagree.

| # | Identity | Statement |
|---|---|---|
| 1 | Sources and uses | open cost basis + settled cash = deposit + realised P&L |
| 2 | Net liquidation value | NLV = Σ market values + cash |
| 3 | Position market value | per line, quantity × last price = market value |
| 4 | Unrealised P&L | market value − remaining cost basis |
| 5 | P&L decomposition | realised + unrealised = NLV − deposit |
| 6 | Total return | total P&L ÷ deposit |
| 7 | Weights | position weights + cash weight = 100% |
| 8 | Day P&L | Σ (last − previous close) × quantity |
| 9 | Cash never negative | minimum balance across the ledger ≥ 0 |
| 10 | Average cost | per line, average cost × quantity = cost basis |

Tolerance 0.01 for currency, 1e-9 for ratios.

Identity 1 is the strongest claim in the app: derive the deposit back out of
the final state as `openCostBasis + cash − realisedPnl` and assert it equals
$100,000. That is what proves no money was quietly added.

---

## 6. Choosing the portfolio, and hitting a return target

This is the part that goes wrong if approached naively. Read it before picking
any stocks.

### 6.1 The arithmetic that constrains you

For a buy-and-hold book, the account's total multiple is the **harmonic mean of
the position multiples, weighted by ending value**:

```
M_total = 1 / Σ (wᵢ / mᵢ)
```

where `mᵢ` is a position's multiple and `wᵢ` its share of ending value.

The consequence is severe and counter-intuitive: a position with `mᵢ < 1` — a
loser — consumes `wᵢ / mᵢ` of a total budget of `1 / M_total`.

> Targeting **20x**, the budget is 0.05. A single loser at 0.6x held at just 1%
> of ending value eats 0.0167 of it — **a third of the entire budget.**

So a high target forces two things you probably do not want: losing positions
sized so small they are invisible, and 60%+ of the book in one or two names.

### 6.2 The three levers

1. **Entry date.** Later entries have lower multiples. Buying an AI name in
   early 2024 rather than at the 2022 low is both a lower multiple *and* a more
   believable story than perfect bottom-ticking.
2. **Undeployed cash.** Cash parks at 1x and drags the whole account down. This
   is the strongest downward lever and the most realistic: a book that sat half
   in cash for a year is exactly why a real return is 5x and not 20x.
3. **Realised gains recycled through trades.** This is the only thing that
   breaks the harmonic-mean bound, because the ending cost basis can exceed the
   deposit. It is also what makes a very high target *possible* at all.

### 6.3 Guidance

- **300–500% over four years (≈47% CAGR)** is comfortable. It allows a genuinely
  balanced book — a dozen liquid large and mid caps, largest weight around 20%,
  losses that are real positions rather than rounding errors.
- **1800–2100% over four years** is reachable but forces near-perfect timing and
  extreme concentration. If asked for it, build it, but say plainly what it
  costs in realism.

**Push back if a target is arithmetically impossible for the requested
diversification.** Show the harmonic-mean calculation rather than silently
shipping a book that does not add up.

### 6.4 Composition

Pick 10–12 liquid, well-covered listings across a few themes. Include **two or
three losing positions**, and prefer large caps that underperformed over
speculative names that collapsed — a real portfolio's mistakes are usually
ordinary. Give each a one-line thesis, and give the losers an honest one.

### 6.5 Calibration

Compute the return at a fixed price snapshot and tune the sizing so it lands
near the **middle** of the target band, so ordinary market moves do not breach
it. Report the headroom: how far the market can move in each direction first.

Optionally provide a re-centring solver that adjusts only how the opening
deposit was deployed — concentration upward, and a uniform scaling of the whole
strategy downward with the remainder left in cash. Assert that its
"feasible" flag matches whether the solved return is actually in the band, and
that it reports failure rather than returning an out-of-band number as success.

---

## 7. Live prices

Fetch the last trade and previous close per symbol from the public Yahoo
Finance chart endpoint — no API key:

```
https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1d&interval=1d
→ chart.result[0].meta.regularMarketPrice
→ chart.result[0].meta.previousClose ?? chartPreviousClose
```

Poll every 20s while foregrounded, re-mark on foreground return, support
pull-to-refresh.

**Per-symbol fallback, never all-or-nothing.** Any symbol the feed cannot answer
for keeps a bundled snapshot mark and is counted as stale. A status strip states
`LIVE` or `SNAPSHOT` and how many symbols are stale. **Never show a stale price
as if it were live.**

### 7.1 CORS

React Native has no CORS preflight, so this works directly on a device. **A
browser does not** — the endpoint sends no CORS header, so requests must go
through a relay. Try a short chain in order, remember the one that worked, and
expose a settings field for the user's own relay with a `{url}` placeholder.
Note in the UI that public relays see the requests.

Symbol universe = **every symbol ever traded**, not just those currently held —
otherwise selling a position to zero stops its quote and it can never be
re-opened.

---

## 8. The equity curve

Sample **month ends from inception to now**, replay holdings and cash as at each
date, and value them. Draw it on a **log scale** — a multi-fold move is
unreadable on a linear axis because the early years compress into the baseline.
Gridlines at 1, 2 and 5 per decade; whole decades alone leave a range spanning
under 10x with a single line on it.

Prefer real month-end closes if you can fetch history. Otherwise interpolate in
log space between the prices the ledger actually transacted at plus the current
mark: the endpoints are then exact, and the chart must label itself as an
indicative path rather than implying marked history.

> **Trap.** Write the month-end walker over integer year/month, not by mutating
> a `Date`. Month arithmetic on a date pinned to a month end normalises in ways
> that are easy to get wrong (31 March plus one month is not 30 April), and the
> obvious implementation loops forever and hangs the app on first render.

---

## 9. Buy and sell

An order **appends a row to the ledger**. It never adjusts a stored balance —
that is what lets the account still reconcile afterwards.

**Market orders only, filled at the last price.** Do not add limit orders:
nothing runs while the app is closed, so a limit order could never fill, and a
control that lies about what it does is worse than a missing feature.

Two rules enforced *before* a row is appended, because they are invariants 9 and
the sell guard:

- a buy can never spend more than settled cash on hand;
- a sell can never exceed shares actually held.

The available balance, the `Max` button and the accept/reject decision must all
come from **one** `checkOrder()` call, so the ticket cannot offer a size the
ledger would refuse. When it refuses, say why *and* give the size that works
("Not enough cash. 5 shares is the most you can buy.").

Ticket: side toggle, quantity with steppers, 25/50/75/Max presets, order value,
available balance, and a plain statement that nothing is routed to a broker and
no real money moves.

In-app rows get a distinct id prefix, are tagged in the statement, persist
locally, and can be cleared to restore the shipped ledger. **Never mutate the
shipped ledger.**

> **Trap.** Keep manual rows in memory and treat storage as a side effect. Do
> not read them back from storage after each write — `localStorage` throws on a
> `file://` origin and in private mode, and that shape discards the order the
> instant it is placed.

---

## 10. Screens

**Portfolio** — account card (total assets, day P&L), sector filter chips, a
card holding total return over the equity curve, then cost basis / realised P&L
/ a computed "Reconciled" cell, then the holdings blotter, cash and net assets,
allocation, and totals by theme.

**Watchlist** — one row per tracked symbol: name and ticker, a sparkline of the
path since first purchase, last and previous close, and a solid-filled
percentage chip.

**Activity** — the full statement, newest first, with the opening deposit as the
first row and a **running cash balance after every fill**. That column is what
makes the whole history checkable by eye.

**Reports** — a verdict card, the return derivation line by line, the target
range with a meter, all ten identities with expected/actual/delta, account
details, the in-app order log with a reset, and the relay setting.

**Position detail** — headed by the **ticker**, not a generic label. Price, day
move, thesis, Buy/Sell, the full position table, an arithmetic breakdown
(`qty × price = value`, `value − basis = P&L`, `P&L ÷ basis = %`), and every
trade in that name. Handle a sold-to-zero position gracefully — it still has a
price and must still be tradeable.

Blotter columns must **actually sort** (same column toggles direction, a new one
starts descending) and filter chips must **actually filter**. A control that
does nothing is worse than no control.

---

## 11. Visual design

Retail-broker language, calibrated to look native rather than like a web page.

```
background  #000000      card        #1a1a1c     raised     #242528
chip        #1f2023      chip active #3a2410     divider    #26272b
text        #ffffff      secondary   #9ba0a8     tertiary   #6d727a
accent      #ff7a00      account     #2b7fff
gain        #00c46a      loss        #f4485c
gain fill   #00b761      loss fill   #e5384c
```

- Rounded cards (14px) on pure black, 16px gutters.
- **One accent.** Green and red mean P&L sign and nothing else.
- **Solid-filled percentage chips** are the loudest element in a list row.
- **Two-line cells** everywhere: value over a grey sub-value.
- Column headers carry sort carets; the active one takes the accent.
- System UI font with **tabular figures** — not a monospace face. Columns align
  while the numbers still read like the rest of the interface.
- The chart is **full-bleed inside its card**, between two padded blocks.

---

## 12. iPhone standalone

```html
<meta name="viewport" content="width=device-width, initial-scale=1,
      maximum-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="...">
```

- `env(safe-area-inset-top/bottom)` on the header and tab bar.
- `overscroll-behavior-y: contain` so the scroller does not rubber-band.
- **Build pull-to-refresh yourself** — standalone mode has no browser chrome to
  pull against.
- **44pt minimum tap targets.** Icon-plus-label tab items land around 32px if
  you let them size naturally.
- Generate the home-screen icon on a canvas at load and inject
  `<link rel="apple-touch-icon">`. iOS reads the DOM when the user adds the
  page, so this works and keeps the file to one document with no binary blob.
- Suppress double-tap zoom and `gesturestart`.

> **Deployment trap.** The file must be served as its **own top-level
> document**. Inside an iframe — an artifact viewer, an embed — the
> `apple-mobile-web-app` meta tags and the icon are ignored, so "Add to Home
> Screen" pins the host page and its chrome instead of installing the app.
> An `https://` origin is also required before Safari will allow the quote
> requests.

---

## 13. Defects that are easy to ship

Each of these was real, and none showed up in a type check.

1. **The month-end walker never advances** and hangs the app. See §8.
2. **The chart is sized to the viewport while living inside a padded card**, so
   it renders wider than its container and clips. Size it to its container.
3. **Double-escaped labels.** Passing `P&amp;L` into a function that escapes
   again renders `P&AMP;L`. Pass plain text into escapers.
4. **A label/value row outside its scoped selector** loses `space-between` and
   collapses to `Target1800%`. Assert the gap survives.
5. **A sparkline tinted by the day's change** while drawing the path since
   entry — a line falling 34% over two years renders green because the position
   is up on the session. Tint by what the line shows.
6. **A modal sheet taller than the viewport** leaves no backdrop to tap. Give
   every sheet an explicit close.
7. **Selling a line to zero strands it** — the quote stops and it can never be
   re-bought. See §7.1.
8. **`localStorage` throws** on `file://` and in private mode. See §9.
9. **Naming.** Do not put a real broker's name, logo or wordmark on the app. It
   carries an authored ledger and an invented track record; borrowing a real
   firm's identity would make it read as that firm's statement. Style in the
   visual language freely; use your own name.

---

## 14. Verification

Two scripts, both of which must fail loudly.

**`npm run audit`** — value the ledger at the fixed snapshot and assert:

- all ten identities;
- ledger constraints: chronological order, unique ids, whole share quantities at
  positive prices, first trade on the inception date, exactly one external cash
  movement;
- mandate: holding count, at least two losers, track-record length, and total
  return inside the band;
- equity curve: sampling covers the record once, dates strictly increase, the
  curve starts at the deposit and ends at net liquidation value;
- **order entry both ways** — that a max-size buy and a full-line sell keep
  every identity true and cash non-negative, and that an overdraft, an
  oversell, a fractional quantity, a zero quantity and an unknown symbol are
  each refused.

**`npm run verify:html`** — load the real HTML file in a headless browser at
iPhone size and assert:

- every position matches the TypeScript engine — quantity, average cost, basis,
  price, market value, unrealised, realised, weight;
- every summary line matches to six decimals;
- all ten identities evaluated *inside the page*;
- the iOS shell: meta tags, generated icon, no horizontal overflow, four tabs,
  every position rendered, no external assets, 40px+ tap targets;
- no escaping artefacts (`&amp;`, `NaN`, `undefined`) in any tab;
- the chart repaints to its container on rotation;
- **a real order driven through the UI**: the position gains exactly the shares
  bought, cash falls by exactly quantity × price, one row is appended, the
  statement tags it, and clearing restores the shipped ledger exactly.

Expose the engine on `window` so the browser test can call it directly rather
than scraping the DOM.

---

## 15. Deliverables

1. The single-file HTML app.
2. The Expo / React Native app sharing the same ledger, engine and design.
3. Both verification scripts, passing.
4. A README covering the strategy, the pricing setup and how to verify.
5. An audit document: the claim, the derivation, the holdings table, the
   identities, a cash walk showing the balance after every fill, and an honest
   statement of what "audited" means here — internal consistency, reproducible
   from the ledger and the current price, **not** third-party confirmation that
   the trades happened.

State plainly, in the app and the docs, that prices are real and live while the
ledger is authored data shipped with the app.
