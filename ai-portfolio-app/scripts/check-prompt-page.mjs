/** Sanity-check the rendered build-prompt page in a real browser. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const file = resolve(process.argv[2] ?? 'dist/build-prompt.html');
const md = readFileSync(
  fileURLToPath(new URL('../docs/BUILD-PROMPT.md', import.meta.url)),
  'utf8',
);

const failures = [];
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, colorScheme: scheme });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`file://${file}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => {
    const doc = document.getElementById('doc');
    const cs = getComputedStyle(document.body);
    return {
      errors: 0,
      headings: doc.querySelectorAll('h2').length,
      tables: doc.querySelectorAll('table').length,
      wrapped: doc.querySelectorAll('.tablewrap table').length,
      codeBlocks: doc.querySelectorAll('pre').length,
      quotes: doc.querySelectorAll('blockquote').length,
      chars: doc.innerText.length,
      raw: document.getElementById('src').textContent.length,
      bg: cs.backgroundColor,
      fg: cs.color,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  console.log(`\n${scheme.toUpperCase()}`);
  check(errors.length === 0, 'No script errors', errors.join(' | ') || 'clean');
  check(state.headings >= 12, 'All sections rendered', `${state.headings} h2`);
  // The document has one table (the identities); what matters is that every
  // table found is wrapped, not how many there are.
  check(state.tables >= 1 && state.tables === state.wrapped,
    'Every table is in a scroll container', `${state.wrapped}/${state.tables} wrapped`);
  check(state.codeBlocks >= 3, 'Code blocks rendered', `${state.codeBlocks}`);
  check(state.quotes >= 3, 'Callouts rendered', `${state.quotes}`);
  check(state.chars > 8000, 'Body has real content', `${state.chars} chars`);
  check(state.raw === md.length, 'Embedded source matches the markdown byte for byte',
    `${state.raw} vs ${md.length}`);
  check(!state.overflow, 'No horizontal overflow');
  // A transparent body would borrow the host's ground and could render one
  // theme's text on the other theme's background.
  check(/^rgba?\(/.test(state.bg) && state.bg !== 'rgba(0, 0, 0, 0)',
    'Body paints its own background', state.bg);
  check(state.fg !== state.bg, 'Text is not the same colour as the ground', `${state.fg}`);

  if (scheme === 'light') {
    await page.screenshot({ path: 'dist/prompt-light.png', fullPage: false });
  } else {
    await page.screenshot({ path: 'dist/prompt-dark.png', fullPage: false });
  }
  await page.close();
}

await browser.close();
console.log('');
if (failures.length) {
  console.log(`FAILED — ${failures.join(', ')}`);
  process.exit(1);
}
console.log('Build-prompt page renders correctly in both themes.');
