import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../doc/screenshots');
const BASE_URL = 'http://localhost:3000';

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page: any, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  await ensureDir(SCREENSHOTS_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ========== 1. Login ==========
  console.log('[1/8] Login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[placeholder*="用户名"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  await screenshot(page, '01-login');

  // Do login
  await page.fill('input[placeholder*="用户名"]', 'admin');
  await page.fill('input[placeholder*="密码"]', 'admin123');
  await page.click('button:has-text("登录")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // ========== 2. Dashboard ==========
  console.log('[2/8] Dashboard...');
  await screenshot(page, '02-dashboard');

  // ========== 3. Batch List ==========
  console.log('[3/8] Batch List...');
  await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '03-batch-list');

  // ========== 4. Process Dictionary ==========
  console.log('[4/8] Process Dictionary...');
  await page.goto(`${BASE_URL}/processes`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await screenshot(page, '04-process-dict');

  // ========== 5. Process Hub (Scan Entry) ==========
  console.log('[5/8] Process Hub...');
  await page.goto(`${BASE_URL}/process-hub`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '05-process-hub');

  // ========== 6. Cell Trace ==========
  console.log('[6/8] Cell Trace...');
  await page.goto(`${BASE_URL}/trace`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '06-cell-trace');

  // ========== 7. Big Screen ==========
  console.log('[7/8] Big Screen...');
  await page.goto(`${BASE_URL}/big-screen`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '07-big-screen');

  // ========== 8. User Management ==========
  console.log('[8/8] User Management...');
  await page.goto(`${BASE_URL}/system/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '08-user-management');

  console.log('\nAll screenshots captured successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
