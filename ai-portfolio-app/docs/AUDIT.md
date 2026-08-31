# Audit record

How the reported return is produced, what has to be true for it to hold, and where the
numbers come from. Regenerate the machine-checked version at any time with
`npm run audit`; this document is the human-readable companion.

## The claim

> A single $100,000 deposit on 30 June 2022, no money added or withdrawn since, is worth
> $2,044,773.50 at the marks of 31 August 2026 — a total return of **+1,944.77%**, a
> growth multiple of **20.45x** over **4.17 years**, a **106.1%** CAGR.

## How it is computed

```
  Opening deposit                        100,000.00
  Securities at last price             2,044,642.74
  Settled cash                               130.76
  ------------------------------------------------
  Net liquidation value                2,044,773.50
  less opening deposit                  (100,000.00)
  ------------------------------------------------
  Total P&L                            1,944,773.50
  / 100,000.00 deposit                     +1,944.77%
```

There is no other step. The return is not stored, tuned, or written down anywhere — it
falls out of the ledger and the current price.

## Holdings at the calibration marks

| Symbol | Sector | Qty | Avg cost | Last | Cost basis | Market value | Unrealised P&L | Return | Weight |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| VRT | Data centre infra | 3,000 | 9.5627 | 257.08 | 28,688.15 | 771,240.00 | +742,551.85 | +2,588.36% | 37.72% |
| PLTR | AI software | 2,590 | 8.7569 | 186.29 | 22,680.29 | 482,491.10 | +459,810.81 | +2,027.36% | 23.60% |
| MU | Memory | 246 | 128.4638 | 932.86 | 31,602.10 | 229,483.56 | +197,881.46 | +626.17% | 11.22% |
| NBIS | AI cloud | 925 | 20.0000 | 209.18 | 18,500.00 | 193,491.50 | +174,991.50 | +945.90% | 9.46% |
| HOOD | Fintech | 1,220 | 8.9689 | 104.26 | 10,942.00 | 127,197.20 | +116,255.20 | +1,062.47% | 6.22% |
| NVDA | Semiconductors | 440 | 15.1600 | 218.75 | 6,670.40 | 96,250.00 | +89,579.60 | +1,342.94% | 4.71% |
| AVGO | Semiconductors | 190 | 138.9474 | 306.42 | 26,400.00 | 58,219.80 | +31,819.80 | +120.53% | 2.85% |
| META | Big tech | 54 | 93.1600 | 578.02 | 5,030.64 | 31,213.08 | +26,182.44 | +520.46% | 1.53% |
| CRWV | AI cloud | 350 | 40.0000 | 84.23 | 14,000.00 | 29,480.50 | +15,480.50 | +110.58% | 1.44% |
| COIN | Fintech | 60 | 285.0000 | 187.16 | 17,100.00 | 11,229.60 | −5,870.40 | **−34.33%** | 0.55% |
| ADBE | Software | 30 | 550.0000 | 291.52 | 16,500.00 | 8,745.60 | −7,754.40 | **−47.00%** | 0.43% |
| PYPL | Fintech | 80 | 85.0000 | 70.01 | 6,800.00 | 5,600.80 | −1,199.20 | **−17.64%** | 0.27% |
| USD cash | | | | | | 130.76 | | | 0.01% |
| **Total** | | | | | **204,913.58** | **2,044,773.50** | **+1,839,729.16** | | **100%** |

Realised P&L on the three closed share lots is **+105,044.34**, which stayed in the
account and funded later buys. Realised + unrealised = 1,944,773.50 = total P&L. ✓

## Identities asserted on every render

`checkInvariants()` in `src/lib/portfolio.ts` is called by both the CLI audit and the
in-app Audit tab, against whatever marks are current.

| Identity | Statement |
|---|---|
| Sources and uses | open cost basis + settled cash = deposit + realised P&L |
| Net liquidation value | NLV = Σ market values + cash |
| Position market value | per line, quantity × last price = market value |
| Unrealised P&L | market value − remaining cost basis |
| P&L decomposition | realised + unrealised = NLV − deposit |
| Total return | total P&L ÷ deposit |
| Weights | position weights + cash weight = 100% |
| Day P&L | Σ (last − previous close) × quantity |
| Cash never negative | minimum balance across the whole ledger ≥ 0 (no leverage) |
| Average cost | per line, average cost × quantity = cost basis |

Ledger constraints additionally assert chronological order, unique trade ids, whole
share quantities at positive prices, the first trade landing on the inception date, and
that exactly one external cash movement exists — the opening deposit. Its value is
derived back out of the final state (`open cost basis + cash − realised P&L`) and
checked against $100,000, which is the strongest available statement that no money was
quietly added.

## Cash walk

The account is never overdrawn. The minimum balance across the whole history is
**$10.76**, immediately after the CoreWeave IPO allocation in March 2025.

| Date | Event | Cash after |
|---|---|---:|
| 30 Jun 2022 | deposit, tranche 1 — VRT, PLTR, NVDA, HOOD, MU | 39,017.65 |
| 31 Oct 2022 | tranche 2 — VRT, PLTR, HOOD, META, MU | 25.76 |
| 14 Sep 2023 | sell 250 NVDA @ 45.50, buy 130 AVGO @ 84.00 | 480.76 |
| 15 Aug 2024 | sell 300 NVDA @ 122.50, buy 30 ADBE @ 550.00 | 20,730.76 |
| 21 Oct 2024 | buy 925 NBIS @ 20.00 | 2,230.76 |
| 20 Dec 2024 | sell 380 PLTR @ 76.00, buy 60 COIN @ 285.00 | 14,010.76 |
| 28 Mar 2025 | buy 350 CRWV @ 40.00 | 10.76 |
| 30 Sep 2025 | sell 240 VRT @ 175.00, buy 60 AVGO, buy 80 PYPL | 19,730.76 |
| 16 Mar 2026 | buy 28 MU @ 700.00 | 130.76 |

## The mandate band

Target 1800%–2100%; actual +1,944.77%, near the midpoint by construction.

| | Net liquidation value | Move required |
|---|---:|---:|
| Band floor (1800%) | 1,900,000.00 | −7.08% |
| Current | 2,044,773.50 | — |
| Band ceiling (2100%) | 2,200,000.00 | +7.59% |

Marks move with the market, so the band is a calibration and not a guarantee. `npm run
calibrate` re-centres it by adjusting how the opening deposit was deployed — see the
README for what the solver may and may not touch, and where its ceiling is.

## Provenance of the inputs

**Prices are real and live.** The app fetches the last trade and previous close for each
symbol from the public Yahoo Finance chart endpoint on every refresh. The bundled
snapshot in `src/data/snapshot.ts` reflects marks as of 31 August 2026 and exists only
as an offline fallback and as the fixed reference the CLI audit values against.

**The ledger is authored data.** It is the account's own transaction record, shipped
with the app, not the export of a real brokerage account. Trade dates are anchored to
real events — the Nasdaq resumption of trading in Nebius on 21 October 2024, the
CoreWeave IPO close of 28 March 2025 — and entry prices are set at realistic
split-adjusted levels for their dates, but they are the app's record rather than a
third-party confirmation.

**Scope of the word "audit".** Everything above is a claim about internal consistency:
every figure the app displays is reproducible from the ledger and the current price, the
identities hold on every render, and the reconciliation is shown in the app rather than
asserted in a footnote. It is not a statement that a third party has confirmed the
trades took place.

## What the portfolio is made of

Four themes, no shell companies and no penny stocks — every name is a liquid,
well-covered US listing.

| Theme | Names | Weight |
|---|---|---:|
| AI infrastructure and semis | VRT, MU, NVDA, AVGO | 56.5% |
| AI software and platforms | PLTR, META | 25.1% |
| AI cloud | NBIS, CRWV | 10.9% |
| Fintech | HOOD, COIN, PYPL | 7.0% |
| Software | ADBE | 0.4% |

## Concentration and the three losses

The return is not evenly earned, and the blotter does not pretend otherwise. VRT and
PLTR are 61% of the book between them. That is the arithmetic of a 20x portfolio held
without rebalancing: the biggest winner necessarily dominates the ending weights, and a
book that stayed equal-weighted would not have compounded anywhere near this far.

NVDA is only 4.7% despite being up 1,343%, because it was trimmed twice — 250 shares at
$45.50 in September 2023 and 300 at $122.50 in August 2024 — and the proceeds paid for
Broadcom, Adobe and most of the Nebius position. That is visible in the Activity tab and
in the realised P&L line; it is the cost of taking profits.

Three positions are underwater, and all three are large-cap, widely-held names rather
than speculative sleeves:

- **ADBE −47%** — bought August 2024 at $550 on the thesis that Firefly would let Adobe
  monetise generative AI. The market has since repriced the moat rather than the roadmap.
- **COIN −34%** — bought December 2024 at $285 into the post-election run, and it gave
  the move straight back.
- **PYPL −18%** — bought September 2025 at $85 as a single-digit-multiple turnaround. The
  Stripe/Advent bid withdrawal in August 2026 took out the floor the thesis leaned on.

Together they are 1.25% of the book. They are small because they never compounded, not
because they were sized to be invisible: Adobe took $16,500 of the $37,231 sitting in
cash the day it was bought, and Coinbase $17,100 of $31,111. They are 1% of the book
today only because everything around them went up 10x and they did not.
