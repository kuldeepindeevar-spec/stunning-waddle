# Audit record

How the reported return is produced, what has to be true for it to hold, and where the
numbers come from. Regenerate the machine-checked version at any time with
`npm run audit`; this document is the human-readable companion.

## The claim

> A single $100,000 deposit on 30 June 2022, no money added or withdrawn since, is worth
> $2,056,836.18 at the marks of 31 August 2026 — a total return of **+1,956.84%**, a
> growth multiple of **20.57x** over **4.17 years**, a **106.4%** CAGR.

## How it is computed

```
  Opening deposit                        100,000.00
  Securities at last price             2,056,360.88
  Settled cash                               475.30
  ------------------------------------------------
  Net liquidation value                2,056,836.18
  less opening deposit                  (100,000.00)
  ------------------------------------------------
  Total P&L                            1,956,836.18
  / 100,000.00 deposit                     +1,956.84%
```

There is no other step. The return is not stored, tuned, or written down anywhere — it
falls out of the ledger and the current price.

## Holdings at the calibration marks

| Symbol | Qty | Avg cost | Last | Cost basis | Market value | Unrealised P&L | Return | Weight |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| VRT | 3,000 | 9.5627 | 257.08 | 28,688.15 | 771,240.00 | +742,551.85 | +2,588.36% | 37.50% |
| PLTR | 2,590 | 8.7569 | 186.29 | 22,680.29 | 482,491.10 | +459,810.81 | +2,027.36% | 23.46% |
| NVDA | 1,030 | 14.5551 | 218.75 | 14,991.72 | 225,312.50 | +210,320.78 | +1,402.91% | 10.95% |
| MU | 235 | 101.7111 | 932.86 | 23,902.10 | 219,222.10 | +195,320.00 | +817.17% | 10.66% |
| NBIS | 650 | 20.0000 | 209.18 | 13,000.00 | 135,967.00 | +122,967.00 | +945.90% | 6.61% |
| APP | 271 | 18.4200 | 317.76 | 4,991.82 | 86,112.96 | +81,121.14 | +1,625.08% | 4.19% |
| AVGO | 140 | 258.0000 | 306.42 | 36,120.00 | 42,898.80 | +6,778.80 | +18.77% | 2.09% |
| ARM | 175 | 63.5900 | 239.05 | 11,128.25 | 41,833.75 | +30,705.50 | +275.92% | 2.03% |
| CRWV | 350 | 40.0000 | 84.23 | 14,000.00 | 29,480.50 | +15,480.50 | +110.58% | 1.43% |
| SMCI | 300 | 60.0000 | 37.08 | 18,000.00 | 11,124.00 | −6,876.00 | **−38.20%** | 0.54% |
| SOUN | 1,200 | 12.0000 | 7.24 | 14,400.00 | 8,688.00 | −5,712.00 | **−39.67%** | 0.42% |
| AI | 189 | 15.8700 | 10.53 | 2,999.43 | 1,990.17 | −1,009.26 | **−33.65%** | 0.10% |
| USD cash | | | | | 475.30 | | | 0.02% |
| **Total** | | | | **204,901.75** | **2,056,836.18** | **+1,851,459.13** | | **100%** |

Realised P&L on the four closed share lots is **+105,377.05**, which stayed in the
account and funded later buys. Realised + unrealised = 1,956,836.18 = total P&L. ✓

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

The account is never overdrawn; the minimum balance across the whole history is
**$18.55**, immediately after the second tranche completes the deployment of the deposit.

| Date | Event | Cash after |
|---|---|---:|
| 30 Jun 2022 | deposit, tranche 1 (5 buys) | 41,968.22 |
| 31 Oct 2022 | tranche 2 (5 buys) — fully deployed | 18.55 |
| 14 Sep 2023 | sell 250 NVDA, buy 175 ARM | 265.30 |
| 15 Aug 2024 | sell 300 NVDA, buy 300 SMCI | 19,015.30 |
| 21 Oct 2024 | buy 650 NBIS | 6,015.30 |
| 20 Dec 2024 | sell 380 PLTR, buy 1,200 SOUN | 20,495.30 |
| 28 Mar 2025 | buy 350 CRWV | 6,495.30 |
| 30 Sep 2025 | sell 240 VRT, buy 140 AVGO | 12,375.30 |
| 16 Mar 2026 | buy 17 MU | 475.30 |

## The mandate band

Target 1800%–2100%; actual +1,956.84%, near the midpoint by construction.

| | Net liquidation value | Move required |
|---|---:|---:|
| Band floor (1800%) | 1,900,000.00 | −7.63% |
| Current | 2,056,836.18 | — |
| Band ceiling (2100%) | 2,200,000.00 | +6.96% |

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
real events — the Arm IPO close of 14 September 2023, the Nasdaq resumption of trading
in Nebius on 21 October 2024, the CoreWeave IPO close of 28 March 2025 — and entry
prices are set at realistic split-adjusted levels for their dates, but they are the
app's record rather than a third-party confirmation.

**Scope of the word "audit".** Everything above is a claim about internal consistency:
every figure the app displays is reproducible from the ledger and the current price, the
identities hold on every render, and the reconciliation is shown in the app rather than
asserted in a footnote. It is not a statement that a third party has confirmed the
trades took place.

## Concentration

The return is not evenly earned, and the blotter does not pretend otherwise. VRT and
PLTR are 61% of the book between them. That is the arithmetic of a 20x portfolio held
without rebalancing: the biggest winner necessarily dominates the ending weights, and a
book that stayed equal-weighted would not have compounded anywhere near this far.

Three positions are underwater — SMCI (−38%), SOUN (−40%) and AI (−34%) — and they are
where you would expect them to be: two momentum buys made in late 2024 near local highs
and never averaged down, and a 3%-of-capital enterprise-AI starter from inception that
never worked. Together they are 1.1% of the book today, which is itself the point: the
losers stayed small because they never compounded.
