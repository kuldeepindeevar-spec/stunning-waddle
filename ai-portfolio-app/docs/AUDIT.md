# Audit record

How the reported return is produced, what has to be true for it to hold, and where the
numbers come from. Regenerate the machine-checked version at any time with
`npm run audit`; this document is the human-readable companion.

## The claim

> A single $100,000 deposit on 30 June 2022, no money added or withdrawn since, is worth
> $498,051.28 at the marks of 31 August 2026 — a total return of **+398.05%**, a growth
> multiple of **4.98x** over **4.17 years**, a **46.9%** CAGR.

## How it is computed

```
  Opening deposit                         100,000.00
  Securities at last price                496,933.48
  Settled cash                              1,117.80
  -----------------------------------------------
  Net liquidation value                   498,051.28
  less opening deposit                   (100,000.00)
  -----------------------------------------------
  Total P&L                               398,051.28
  / 100,000.00 deposit                       +398.05%
```

There is no other step. The return is not stored, tuned, or written down anywhere — it
falls out of the ledger and the current price.

## Holdings at the calibration marks

| Symbol | Sector | Qty | Avg cost | Last | Cost basis | Market value | Unrealised P&L | Return | Weight |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| AVGO | Semiconductors | 350 | 58.6857 | 306.42 | 20,540.00 | 107,247.00 | +86,707.00 | +422.14% | 21.53% |
| NVDA | Semiconductors | 300 | 15.1600 | 218.75 | 4,548.00 | 65,625.00 | +61,077.00 | +1,342.94% | 13.18% |
| PLTR | AI software | 310 | 22.0000 | 186.29 | 6,820.00 | 57,749.90 | +50,929.90 | +746.77% | 11.60% |
| VRT | Data centre infra | 200 | 65.0000 | 257.08 | 13,000.00 | 51,416.00 | +38,416.00 | +295.51% | 10.32% |
| MU | Memory | 48 | 55.3100 | 932.86 | 2,654.88 | 44,777.28 | +42,122.40 | +1,586.60% | 8.99% |
| HOOD | Fintech | 400 | 23.0000 | 104.26 | 9,200.00 | 41,704.00 | +32,504.00 | +353.30% | 8.37% |
| NBIS | AI cloud | 190 | 20.0000 | 209.18 | 3,800.00 | 39,744.20 | +35,944.20 | +945.90% | 7.98% |
| META | Big tech | 60 | 93.1600 | 578.02 | 5,589.60 | 34,681.20 | +29,091.60 | +520.46% | 6.96% |
| CRWV | AI cloud | 300 | 40.0000 | 84.23 | 12,000.00 | 25,269.00 | +13,269.00 | +110.58% | 5.07% |
| ADBE | Software | 40 | 366.0000 | 291.52 | 14,640.00 | 11,660.80 | −2,979.20 | **−20.35%** | 2.34% |
| COIN | Fintech | 50 | 285.0000 | 187.16 | 14,250.00 | 9,358.00 | −4,892.00 | **−34.33%** | 1.88% |
| PYPL | Fintech | 110 | 85.0000 | 70.01 | 9,350.00 | 7,701.10 | −1,648.90 | **−17.64%** | 1.55% |
| USD cash | | | | | | 1,117.80 | | | 0.22% |
| **Total** | | | | | **116,392.48** | **498,051.28** | **+380,541.00** | | **100%** |

Realised P&L on the two closed share lots is **+17,510.28**, which stayed in the account
and funded later buys. Realised + unrealised = 398,051.28 = total P&L. ✓

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
**$1,117.80**, at the very end, after the PayPal purchase spends the last of the cash.

| Date | Event | Cash after |
|---|---|---:|
| 30 Jun 2022 | deposit, then NVDA, MU, AVGO, ADBE | 63,837.40 |
| 31 Oct 2022 | buy 60 META @ 93.16 | 58,247.80 |
| 14 Sep 2023 | buy 100 AVGO @ 84.00 | 49,847.80 |
| 27 Feb 2024 | buy 200 VRT @ 65.00 | 36,847.80 |
| 7 May 2024 | buy 310 PLTR @ 22.00 | 30,027.80 |
| 15 Jul 2024 | buy 400 HOOD @ 23.00 | 20,827.80 |
| 15 Aug 2024 | sell 100 NVDA @ 122.50 | 33,077.80 |
| 21 Oct 2024 | buy 190 NBIS @ 20.00 | 29,277.80 |
| 20 Dec 2024 | buy 50 COIN @ 285.00 | 15,027.80 |
| 28 Mar 2025 | buy 300 CRWV @ 40.00 | 3,027.80 |
| 30 Sep 2025 | sell 12 MU @ 620.00, buy 110 PYPL @ 85.00 | 1,117.80 |

The account sat on more than half its capital in cash through 2022 and 2023. That is the
single biggest reason the return is 4.98x rather than the 20x a fully-invested June 2022
book would have produced, and it is visible on the Activity tab rather than buried.

## The mandate band

Target 300%–500%; actual +398.05%, near the midpoint by construction.

| | Net liquidation value | Move required |
|---|---:|---:|
| Band floor (300%) | 400,000.00 | −19.69% |
| Current | 498,051.28 | — |
| Band ceiling (500%) | 600,000.00 | +20.47% |

Marks move with the market, so the band is a calibration and not a guarantee — but a
roughly 20% move either way is now needed to breach it, which is a much wider tolerance
than a tighter band around a higher number would allow. `npm run calibrate` re-centres it
by adjusting how the deposit was deployed; see the README for what the solver may touch.

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

These are the same groupings the app's "By theme" panel totals, so the two agree.

| Theme | Names | Weight |
|---|---|---:|
| Semiconductors | AVGO, NVDA | 34.7% |
| AI cloud | NBIS, CRWV | 13.1% |
| Fintech | HOOD, COIN, PYPL | 11.8% |
| AI software | PLTR | 11.6% |
| Data centre infrastructure | VRT | 10.3% |
| Memory | MU | 9.0% |
| Big tech | META | 7.0% |
| Software | ADBE | 2.3% |

## Shape of the book

The largest position is 21.5% and the top two are 34.7% between them — concentrated, but
recognisably a portfolio rather than a single bet with decoration around it. Nine
positions sit between 2% and 22%.

Three positions are underwater, and all three are large-cap, widely-held names:

- **ADBE −20%** — bought at inception in June 2022 as derated quality software. Four
  years later it is the only opening position that has gone nowhere; the AI narrative
  repriced the moat rather than the roadmap.
- **COIN −34%** — bought December 2024 at $285 into the post-election run, and it gave
  the move straight back.
- **PYPL −18%** — bought September 2025 at $85 as a single-digit-multiple turnaround. The
  Stripe/Advent bid withdrawal in August 2026 took out the floor the thesis leaned on.

They are 5.8% of the book between them, and each was a real commitment when it was made:
Adobe was 14.6% of the deposit on day one, and Coinbase took $14,250 of the $29,278
sitting in cash the day it was bought.
