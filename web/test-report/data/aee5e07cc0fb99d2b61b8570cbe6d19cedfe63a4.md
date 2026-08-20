# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-e2e.spec.ts >> Group 1: Auth & Layout >> TC-LOGIN-001~003: Login flow with empty/error/correct credentials
- Location: tests\comprehensive-e2e.spec.ts:8:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 60000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "YT-MES" [level=2] [ref=e5]
  - paragraph [ref=e6]: 电芯生产追溯系统
  - generic [ref=e7]:
    - generic [ref=e11]:
      - img [ref=e14]
      - textbox "用户名" [ref=e16]: admin
    - generic [ref=e20]:
      - img [ref=e23]
      - textbox "密码" [ref=e26]: admin123
      - img [ref=e29] [cursor=pointer]
    - button "登 录" [ref=e34] [cursor=pointer]:
      - generic [ref=e35]: 登 录
  - paragraph [ref=e36]: 登录失败
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // ========================================================================
  4   | // Group 1: Auth & Layout — 登录、密码切换、路由守卫、侧边栏导航
  5   | // ========================================================================
  6   | test.describe('Group 1: Auth & Layout', () => {
  7   | 
  8   |   test('TC-LOGIN-001~003: Login flow with empty/error/correct credentials', async ({ page }) => {
  9   |     test.setTimeout(60000);
  10  |     await page.goto('http://localhost:3000/login');
  11  |     await expect(page).toHaveTitle(/YT-MES/i);
  12  | 
  13  |     // 空提交校验
  14  |     const loginBtn = page.locator('button[type="submit"]');
  15  |     await loginBtn.click();
  16  |     await expect(page.locator('.el-form-item__error').first()).toBeVisible();
  17  | 
  18  |     // 错误用户名
  19  |     await page.fill('input[placeholder="用户名"]', 'wrong');
  20  |     await page.fill('input[placeholder="密码"]', 'wrong');
  21  |     await loginBtn.click();
  22  |     await page.waitForTimeout(1000);
  23  |     await expect(page.locator('.el-message--error, .el-alert--error')).toBeVisible();
  24  | 
  25  |     // 正确凭证
  26  |     await page.fill('input[placeholder="用户名"]', 'admin');
  27  |     await page.fill('input[placeholder="密码"]', 'admin123');
  28  |     await loginBtn.click();
> 29  |     await page.waitForURL('**/dashboard');
      |                ^ Error: page.waitForURL: Test timeout of 60000ms exceeded.
  30  |     await expect(page.locator('.stat-row')).toBeVisible();
  31  |   });
  32  | 
  33  |   test('TC-LOGIN-004: Password visibility toggle', async ({ page }) => {
  34  |     await page.goto('http://localhost:3000/login');
  35  |     const passwordInput = page.locator('input[placeholder="密码"]');
  36  |     const toggleBtn = page.locator('.el-input__password-icon, .el-input__icon.eye-icon');
  37  | 
  38  |     await page.fill('input[placeholder="密码"]', 'test123');
  39  |     await expect(passwordInput).toHaveAttribute('type', 'password');
  40  |     await toggleBtn.click();
  41  |     await page.waitForTimeout(300);
  42  |     await expect(passwordInput).toHaveAttribute('type', 'text');
  43  |     await toggleBtn.click();
  44  |     await page.waitForTimeout(300);
  45  |     await expect(passwordInput).toHaveAttribute('type', 'password');
  46  |   });
  47  | 
  48  |   test('TC-LAYOUT-005: Redirect to login when accessing protected route without token', async ({ page }) => {
  49  |     await page.goto('http://localhost:3000/batches');
  50  |     await page.waitForURL('**/login');
  51  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  52  |   });
  53  | });
  54  | 
  55  | // ========================================================================
  56  | // Group 2: Batch & Warehouse — 批次新建/编辑/关闭、物料仓库
  57  | // ========================================================================
  58  | test.describe('Group 2: Batch & Warehouse', () => {
  59  | 
  60  |   test('TC-BATCH-002~004: Create batch with validation and submission', async ({ page }) => {
  61  |     test.setTimeout(60000);
  62  |     // 先登录
  63  |     await page.goto('http://localhost:3000/login');
  64  |     await page.fill('input[placeholder="用户名"]', 'admin');
  65  |     await page.fill('input[placeholder="密码"]', 'admin123');
  66  |     await page.click('button[type="submit"]');
  67  |     await page.waitForURL('**/dashboard');
  68  | 
  69  |     // 进入批次列表
  70  |     await page.goto('http://localhost:3000/batches');
  71  |     await page.waitForTimeout(1000);
  72  | 
  73  |     // 新建批次
  74  |     await page.locator('button').filter({ hasText: /新建批次|新增/ }).first().click();
  75  |     await page.waitForTimeout(500);
  76  | 
  77  |     // 测试空提交校验
  78  |     await page.click('.el-dialog__footer button:has-text("确定")');
  79  |     await page.waitForTimeout(500);
  80  |     await expect(page.locator('.el-form-item__error').first()).toBeVisible();
  81  | 
  82  |     // 正常填写
  83  |     const randomBatchNo = `BAT-${Date.now().toString().slice(-6)}`;
  84  |     await page.fill('label:has-text("批次号") + .el-form-item__content input', randomBatchNo);
  85  |     await page.fill('label:has-text("产品型号") + .el-form-item__content input', 'YT-MODEL-E2E');
  86  |     await page.fill('label:has-text("产品规格") + .el-form-item__content input', 'YT-SPEC-E2E');
  87  | 
  88  |     // 选择车间
  89  |     await page.locator('label:has-text("生产车间") + .el-form-item__content .el-select__wrapper').click();
  90  |     await page.waitForTimeout(500);
  91  |     await page.locator('.el-select-dropdown__item:visible').first().click();
  92  | 
  93  |     // 选择班组
  94  |     await page.locator('label:has-text("生产班组") + .el-form-item__content .el-select__wrapper').click();
  95  |     await page.waitForTimeout(500);
  96  |     await page.locator('.el-select-dropdown__item:visible').first().click();
  97  | 
  98  |     // 计划数量
  99  |     await page.fill('label:has-text("计划数量") + .el-form-item__content input', '1000');
  100 | 
  101 |     // 开工日期
  102 |     await page.locator('label:has-text("开工日期") + .el-form-item__content input').click();
  103 |     await page.waitForTimeout(500);
  104 |     await page.locator('.el-date-table__row .today').click();
  105 | 
  106 |     // 提交
  107 |     await page.click('.el-dialog__footer button:has-text("确定")');
  108 |     await page.waitForTimeout(1000);
  109 | 
  110 |     // 验证
  111 |     await page.reload();
  112 |     await page.waitForTimeout(1000);
  113 |     await expect(page.locator(`td:has-text("${randomBatchNo}")`).first()).toBeVisible();
  114 |   });
  115 | 
  116 |   test('TC-BATCH-005: Cancel new batch dialog', async ({ page }) => {
  117 |     test.setTimeout(30000);
  118 |     await page.goto('http://localhost:3000/login');
  119 |     await page.fill('input[placeholder="用户名"]', 'admin');
  120 |     await page.fill('input[placeholder="密码"]', 'admin123');
  121 |     await page.click('button[type="submit"]');
  122 |     await page.waitForURL('**/dashboard');
  123 | 
  124 |     await page.goto('http://localhost:3000/batches');
  125 |     await page.waitForTimeout(1000);
  126 |     await page.locator('button').filter({ hasText: /新建批次|新增/ }).first().click();
  127 |     await page.waitForTimeout(500);
  128 |     await page.fill('label:has-text("批次号") + .el-form-item__content input', 'CANCEL-TEST');
  129 | 
```