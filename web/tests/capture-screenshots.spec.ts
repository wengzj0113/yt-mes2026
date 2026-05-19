import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../doc/screenshots');

test.describe('Capture User Manual Screenshots', () => {
  test('capture all pages', async ({ page }) => {
    test.setTimeout(120000);
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    async function shot(name: string) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
      console.log(`  ✓ ${name}.png`);
    }

    // 1. Login page
    console.log('[1/8] Login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await shot('01-login');

    // Login
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    if (inputCount >= 2) {
      await inputs.nth(0).fill('admin');
      await inputs.nth(1).fill('admin123');
    }
    // Try multiple button selectors
    const loginBtn = page.locator('button').filter({ hasText: /登|login|Login/i }).first();
    await loginBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(1000);

    // 2. Dashboard
    console.log('[2/8] Dashboard...');
    await shot('02-dashboard');

    // 3. Batch List
    console.log('[3/8] Batch List...');
    await page.goto('http://localhost:3000/batches', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot('03-batch-list');

    // 4. Process Dictionary
    console.log('[4/8] Process Dictionary...');
    await page.goto('http://localhost:3000/processes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot('04-process-dict');

    // 5. Process Hub
    console.log('[5/8] Process Hub...');
    await page.goto('http://localhost:3000/process-hub', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot('05-process-hub');

    // 6. Cell Trace
    console.log('[6/8] Cell Trace...');
    await page.goto('http://localhost:3000/trace', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot('06-cell-trace');

    // 7. Big Screen
    console.log('[7/8] Big Screen...');
    await page.goto('http://localhost:3000/big-screen', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await shot('07-big-screen');

    // 8. User Management
    console.log('[8/8] User Management...');
    await page.goto('http://localhost:3000/system/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot('08-user-management');

    console.log('\nAll screenshots captured successfully!');
  });
});
