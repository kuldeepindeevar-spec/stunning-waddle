/**
 * Capture the order ticket, which only exists after a tap so the tab-by-tab
 * screenshot pass never sees it. Dev aid: node scripts/ticket-shot.mjs <out>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = process.argv[2] ?? 'shots';
mkdirSync(out, { recursive: true });

const file = fileURLToPath(new URL('../../ai-portfolio.html', import.meta.url));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

await page.goto(`file://${file}`, { waitUntil: 'load' });
await page.waitForTimeout(1400);

// Open a position, then the ticket.
await page.getByText('NVDA', { exact: true }).last().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/detail.png` });

await page.locator('#tradebar [data-trade="BUY"]').click();
await page.waitForTimeout(500);
await page.fill('#qtyInput', '4');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/ticket-buy.png` });

// The rejected state is worth seeing too.
await page.fill('#qtyInput', '9999');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/ticket-rejected.png` });

// Sell side.
await page.fill('#qtyInput', '25');
await page.locator('#sideRow [data-side="SELL"]').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/ticket-sell.png` });

// Place it, then show the statement with the in-app row.
await page.click('#submit');
await page.waitForTimeout(600);
await page.getByText('Activity', { exact: true }).last().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/activity-after.png` });

console.log(`ticket screenshots -> ${out}`);
await browser.close();
