/**
 * Render docs/BUILD-PROMPT.md into a standalone reading page.
 *
 * The markdown stays the single source of truth: it is embedded verbatim in a
 * text/plain script block, rendered client-side by marked, and copied straight
 * from that block — so the page and the prompt can never drift apart.
 *
 *   node scripts/build-prompt-page.mjs [outfile]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../docs/BUILD-PROMPT.md', import.meta.url));
const out = process.argv[2] ?? fileURLToPath(new URL('../dist/build-prompt.html', import.meta.url));

const markdown = readFileSync(source, 'utf8');
const client = readFileSync(
  fileURLToPath(new URL('./prompt-page-client.js', import.meta.url)),
  'utf8',
);
// The only sequence that could close the script block early.
const safe = markdown.replace(/<\/script>/gi, '<\\/script>');

const html = `<title>Portfolio Terminal Build Prompt</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Light is the default; both themes are defined at token level so the
   un-stamped "system" state resolves correctly either way. */
:root {
  --bg: #fbf9f6;
  --surface: #ffffff;
  --sunk: #f2efe9;
  --line: #e2ddd3;
  --line-soft: #ece8e0;
  --ink: #1a1714;
  --ink-2: #56504a;
  --ink-3: #8a827a;
  --accent: #c25a00;
  --accent-soft: #fdf0e2;
  --warn-bg: #fff8ec;
  --warn-line: #e8c893;
  --shadow: 0 1px 2px rgba(26,23,20,.06);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #14120f;
    --surface: #1c1917;
    --sunk: #232019;
    --line: #322d26;
    --line-soft: #262119;
    --ink: #f4f1ec;
    --ink-2: #b3aca3;
    --ink-3: #857d73;
    --accent: #ff9a3c;
    --accent-soft: #2a1c0d;
    --warn-bg: #241a0c;
    --warn-line: #5c4522;
    --shadow: none;
  }
}
:root[data-theme="dark"] {
  --bg: #14120f;
  --surface: #1c1917;
  --sunk: #232019;
  --line: #322d26;
  --line-soft: #262119;
  --ink: #f4f1ec;
  --ink-2: #b3aca3;
  --ink-3: #857d73;
  --accent: #ff9a3c;
  --accent-soft: #2a1c0d;
  --warn-bg: #241a0c;
  --warn-line: #5c4522;
  --shadow: none;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}

.wrap { max-width: 50rem; margin: 0 auto; padding: 0 1.5rem 6rem; }

header.top {
  border-bottom: 1px solid var(--line);
  margin-bottom: 2.5rem;
  padding: 3.5rem 0 2rem;
}
.eyebrow {
  font-family: "IBM Plex Mono", monospace;
  font-size: .72rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--accent); margin-bottom: .9rem;
}
h1 {
  font-family: Fraunces, Georgia, serif;
  font-weight: 700; font-size: clamp(2rem, 5.2vw, 2.9rem);
  line-height: 1.1; letter-spacing: -.02em; margin: 0 0 .9rem;
  text-wrap: balance;
}
.standfirst { color: var(--ink-2); font-size: 1.06rem; margin: 0; max-width: 40rem; }

.actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.6rem; }
button {
  font: 600 .9rem/1 "IBM Plex Sans", sans-serif;
  padding: .72rem 1.1rem; border-radius: .5rem; cursor: pointer;
  border: 1px solid var(--line); background: var(--surface); color: var(--ink);
  box-shadow: var(--shadow);
}
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button:hover { filter: brightness(.97); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* The source rules off each section with ---, so the heading itself must not
   draw a second line. */
article h2 {
  font-family: Fraunces, Georgia, serif;
  font-weight: 700; font-size: 1.55rem; line-height: 1.2; letter-spacing: -.015em;
  margin: 2.4rem 0 1rem; text-wrap: balance;
}
article h2:first-child { margin-top: 0; }
article hr + h2 { margin-top: 0; }
article h3 {
  font-weight: 600; font-size: 1.06rem; letter-spacing: -.005em;
  margin: 2rem 0 .6rem; color: var(--ink);
}
article p { margin: 0 0 1.05rem; }
article ul, article ol { margin: 0 0 1.05rem; padding-left: 1.3rem; }
article li { margin-bottom: .45rem; }
article li::marker { color: var(--ink-3); }
article strong { font-weight: 600; }
article hr { border: none; border-top: 1px solid var(--line); margin: 3rem 0 2.2rem; }

code {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: .86em; background: var(--sunk);
  padding: .12em .38em; border-radius: .25rem;
}
pre {
  background: var(--sunk); border: 1px solid var(--line-soft);
  border-radius: .6rem; padding: 1rem 1.1rem;
  overflow-x: auto; margin: 0 0 1.3rem;
}
pre code { background: none; padding: 0; font-size: .82rem; line-height: 1.62; }

blockquote {
  margin: 0 0 1.3rem; padding: .9rem 1.1rem;
  background: var(--warn-bg); border: 1px solid var(--warn-line);
  border-left-width: 3px; border-radius: .5rem;
}
blockquote p { margin: 0; color: var(--ink); }
blockquote p + p { margin-top: .7rem; }

.tablewrap { overflow-x: auto; margin: 0 0 1.4rem; }
table { border-collapse: collapse; width: 100%; font-size: .92rem; }
th, td {
  text-align: left; padding: .58rem .7rem;
  border-bottom: 1px solid var(--line-soft); vertical-align: top;
}
th { font-weight: 600; color: var(--ink-2); border-bottom-color: var(--line); }
tbody tr:last-child td { border-bottom: none; }

footer.foot {
  margin-top: 4rem; padding-top: 1.4rem; border-top: 1px solid var(--line);
  color: var(--ink-3); font-size: .85rem;
}
#toast {
  position: fixed; left: 50%; bottom: 1.6rem; transform: translate(-50%, 1.5rem);
  background: var(--ink); color: var(--bg);
  padding: .6rem 1rem; border-radius: .5rem; font-size: .88rem; font-weight: 500;
  opacity: 0; pointer-events: none; transition: opacity .18s, transform .18s;
}
#toast.on { opacity: 1; transform: translate(-50%, 0); }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header class="top">
    <div class="eyebrow">Build specification</div>
    <h1>Portfolio Terminal Build Prompt</h1>
    <p class="standfirst">
      A complete brief for building a phone portfolio app against live market prices —
      including the return-target arithmetic, the ten accounting identities, and the
      defects that are easy to ship and hard to notice.
    </p>
    <div class="actions">
      <button class="primary" id="copy">Copy the full prompt</button>
      <button id="theme">Switch theme</button>
    </div>
  </header>

  <article id="doc"></article>

  <footer class="foot">
    Rendered from <code>docs/BUILD-PROMPT.md</code>, which stays the single source of
    truth — the copy button hands you that file verbatim.
  </footer>
</div>

<div id="toast" role="status" aria-live="polite"></div>

<script type="text/plain" id="src">${safe}</script>
<script>${client}</script>
`;

writeFileSync(out, html);
console.log(`build prompt page -> ${out}  (${(html.length / 1024).toFixed(1)} KB)`);
