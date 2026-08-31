# PGY verdict engine

`pgy-verdict-engine.html` — a single self-contained page (inline CSS, vanilla JS, no build
step, no external JS libraries). Open the file in a browser, or paste it into a Claude
artifact.

It is the companion to the PGY flow-metrics tracker. The tracker answers "how is the
business doing" and is a map. This one answers "which story is true, and what should the
position do about it" and is a trial record.

## What it does

- States the two competing hypotheses — H1 informational edge, H2 regulatory conduit —
  and holds a posted `P(H1)` that ships unposted and nags until a number is entered.
- Keeps an append-only evidence ledger. Nothing is deleted or edited; a superseded entry
  is struck with a date and a one-line reason, and the replacement is a new dated entry.
- Runs six discriminating tests, each with what H1 predicts, what H2 predicts, a reading
  computed from the data, and a user-set verdict. Three verdicts reading leaning H2 fire
  an exit review.
- Holds four falsification cards that are immutable once created. F2 and F3 evaluate
  themselves on every data entry; F1 counts down to the estimated 2Q27 print; E1 is an
  event with no date. A breach stays red until adjudicated by an appended dated note.
- Restricts Panel 3 to prices set by parties other than management: the certificate
  fair-value-to-amortized-cost ratio, ABS execution, and the related-party fee share.
- Runs a survival board of binary "can it die" monitors. A card unchecked for more than
  100 days downgrades itself to amber.
- Evaluates rules R1–R4 live against the tests, the falsification cards and the survival
  board, and renders them on the same screen as the evidence.

## Data

Six quarters, 1Q25 through 2Q26, are shipped as filed. Undisclosed figures are `null` and
render `n/d` — never zero, never interpolated, and no cumulative line is drawn across a
null. Diluted share count, stock-based comp, diluted EPS, ABS spreads and pre-2Q26
certificate and related-party figures are not in the dataset; they are entered from
filings and deal data through the update form.

Figures computed on the page from two reported inputs (the 61.8% ratio, the 14.8%
guarantee utilisation) are labelled `derived`.

## Persistence

State is written through `window.storage` under `pgy-verdict:*` keys, every call wrapped
in try/catch. `localStorage` and `sessionStorage` are never used — they fail in Claude
artifacts. Where storage is unavailable the page says so plainly and still works; entries
just do not survive a reload. Reset is guarded by a typed `RESET` confirmation.

---

# AI Alpha Portfolio (`ai-portfolio-app/`)

An unrelated second project in this repository: a mobile trading-terminal app showing a
concentrated AI portfolio funded with a single $100,000 deposit in June 2022, marked
against live market prices, currently at roughly +1,950% total return.

Expo / React Native / TypeScript, iOS + Android + web. Every figure is derived from a
21-row transaction ledger on each render — no stored totals — and `npm run audit`
asserts the accounting identities and the mandate constraints from the command line.

See [`ai-portfolio-app/README.md`](ai-portfolio-app/README.md) and the reconciliation in
[`ai-portfolio-app/docs/AUDIT.md`](ai-portfolio-app/docs/AUDIT.md).
