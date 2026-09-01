/**
 * Render the web build at phone size and capture each tab.
 * Dev aid for reviewing layout without a device: node scripts/shots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const tabs = ['Portfolio', 'Watchlist', 'Activity', 'Audit'];
for (const tab of tabs) {
  const target = page.getByText(tab, { exact: true }).last();
  if (await target.count()) {
    await target.click();
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${OUT}/${tab.toLowerCase()}.png` });
  await page.screenshot({ path: `${OUT}/${tab.toLowerCase()}-full.png`, fullPage: true });
}

// Back to the portfolio tab, scroll to the blotter, then open a position.
await page.getByText('Portfolio', { exact: true }).last().click();
await page.waitForTimeout(500);
await page.mouse.move(200, 500);
for (const y of [1500, 2300]) {
  await page.mouse.wheel(0, y - 900);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/portfolio-scroll-${y}.png` });
}
await page.mouse.wheel(0, -4000);
await page.waitForTimeout(500);
// The blotter row, not the allocation legend entry of the same name.
const nvda = page.getByText('NVDA', { exact: true }).last();
if (await nvda.count()) {
  await nvda.click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/detail.png` });
  await page.screenshot({ path: `${OUT}/detail-full.png`, fullPage: true });
}

console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
