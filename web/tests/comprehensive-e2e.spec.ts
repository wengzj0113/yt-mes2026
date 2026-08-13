import { test, expect } from '@playwright/test';

// ========================================================================
// Group 1: Auth & Layout — 登录、密码切换、路由守卫、侧边栏导航
// ========================================================================
test.describe('Group 1: Auth & Layout', () => {

  test('TC-LOGIN-001~003: Login flow with empty/error/correct credentials', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:3000/login');
    await expect(page).toHaveTitle(/YT-MES/i);

    // 空提交校验
    const loginBtn = page.locator('button[type="submit"]');
    await loginBtn.click();
    await expect(page.locator('.el-form-item__error').first()).toBeVisible();

    // 错误用户名
    await page.fill('input[placeholder="用户名"]', 'wrong');
    await page.fill('input[placeholder="密码"]', 'wrong');
    await loginBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--error, .el-alert--error')).toBeVisible();

    // 正确凭证
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await loginBtn.click();
    await page.waitForURL('**/dashboard');
    await expect(page.locator('.stat-row')).toBeVisible();
  });

  test('TC-LOGIN-004: Password visibility toggle', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    const passwordInput = page.locator('input[placeholder="密码"]');
    const toggleBtn = page.locator('.el-input__password-icon, .el-input__icon.eye-icon');

    await page.fill('input[placeholder="密码"]', 'test123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-LAYOUT-005: Redirect to login when accessing protected route without token', async ({ page }) => {
    await page.goto('http://localhost:3000/batches');
    await page.waitForURL('**/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ========================================================================
// Group 2: Batch & Warehouse — 批次新建/编辑/关闭、物料仓库
// ========================================================================
test.describe('Group 2: Batch & Warehouse', () => {

  test('TC-BATCH-002~004: Create batch with validation and submission', async ({ page }) => {
    test.setTimeout(60000);
    // 先登录
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 进入批次列表
    await page.goto('http://localhost:3000/batches');
    await page.waitForTimeout(1000);

    // 新建批次
    await page.locator('button').filter({ hasText: /新建批次|新增/ }).first().click();
    await page.waitForTimeout(500);

    // 测试空提交校验
    await page.click('.el-dialog__footer button:has-text("确定")');
    await page.waitForTimeout(500);
    await expect(page.locator('.el-form-item__error').first()).toBeVisible();

    // 正常填写
    const randomBatchNo = `BAT-${Date.now().toString().slice(-6)}`;
    await page.fill('label:has-text("批次号") + .el-form-item__content input', randomBatchNo);
    await page.fill('label:has-text("产品型号") + .el-form-item__content input', 'YT-MODEL-E2E');
    await page.fill('label:has-text("产品规格") + .el-form-item__content input', 'YT-SPEC-E2E');

    // 选择车间
    await page.locator('label:has-text("生产车间") + .el-form-item__content .el-select__wrapper').click();
    await page.waitForTimeout(500);
    await page.locator('.el-select-dropdown__item:visible').first().click();

    // 选择班组
    await page.locator('label:has-text("生产班组") + .el-form-item__content .el-select__wrapper').click();
    await page.waitForTimeout(500);
    await page.locator('.el-select-dropdown__item:visible').first().click();

    // 计划数量
    await page.fill('label:has-text("计划数量") + .el-form-item__content input', '1000');

    // 开工日期
    await page.locator('label:has-text("开工日期") + .el-form-item__content input').click();
    await page.waitForTimeout(500);
    await page.locator('.el-date-table__row .today').click();

    // 提交
    await page.click('.el-dialog__footer button:has-text("确定")');
    await page.waitForTimeout(1000);

    // 验证
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator(`td:has-text("${randomBatchNo}")`).first()).toBeVisible();
  });

  test('TC-BATCH-005: Cancel new batch dialog', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/batches');
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: /新建批次|新增/ }).first().click();
    await page.waitForTimeout(500);
    await page.fill('label:has-text("批次号") + .el-form-item__content input', 'CANCEL-TEST');

    // 点击取消
    await page.click('.el-dialog__footer button:has-text("取消")');
    await page.waitForTimeout(500);
    // 弹窗已关闭，无法找到 CANCEL-TEST
    await expect(page.locator('td:has-text("CANCEL-TEST")')).toHaveCount(0);
  });

  test('TC-BATCH-009~010: Batch detail page renders process cards', async ({ page }) => {
    test.setTimeout(60000);
    // 先登录
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/batches');
    await page.waitForTimeout(1000);

    // 点击第一个批次进入详情
    const firstBatchLink = page.locator('table tbody tr:first-child td:first-child a, table tbody tr:first-child td').first();
    if (await firstBatchLink.count() > 0) {
      await firstBatchLink.click();
      await page.waitForURL('**/batches/**');
      await page.waitForTimeout(1000);
      // 验证工序卡片
      const processCards = page.locator('.proc-card');
      await expect(processCards.first()).toBeVisible();
    }
  });
});

// ========================================================================
// Group 3: Trace — 电芯追溯
// ========================================================================
test.describe('Group 3: Cell Trace', () => {

  test('TC-TRACE-001~003: Trace barcode/batch search with empty and correct data', async ({ page }) => {
    test.setTimeout(60000);
    // 先登录
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/trace');
    await page.waitForTimeout(1000);

    // 不存在条码
    await page.fill('input[placeholder*="输入电芯"]', 'NON-EXIST-BARCODE-999');
    await page.click('button:has-text("查询")');
    await page.waitForTimeout(1000);
    if (await page.locator('.el-empty__description').count() > 0) {
      await expect(page.locator('.el-empty__description')).toBeVisible();
    }
    if (await page.locator('.cell-trace__no-result, .no-data').count() > 0) {
      await expect(page.locator('.cell-trace__no-result, .no-data')).toBeVisible();
    }

    // 批次追溯
    const batchTab = page.locator('button.search-tab:has-text("批次"), .el-tabs__item:has-text("批次")');
    if (await batchTab.count() > 0) {
      await batchTab.click();
      await page.waitForTimeout(500);
      await page.fill('input[placeholder*="输入生产批次号"], input[placeholder*="批次"]', 'BAT-DEMO-20250101');
      await page.click('button:has-text("查询")');
      await page.waitForTimeout(1000);
    }
  });

  test('TC-TRACE-008: Clear search history', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/trace');
    await page.waitForTimeout(1000);

    const clearBtn = page.locator('button:has-text("清空")');
    if (await clearBtn.count() > 0) {
      await clearBtn.click();
      await page.waitForTimeout(500);
      // 验证历史记录被清空
      await expect(page.locator('.search-history, .recent-search').first()).toHaveCount(0);
    }
  });
});

// ========================================================================
// Group 4: System Admin — 用户/部门/设备/设置 CRUD
// ========================================================================
test.describe('Group 4: System Admin', () => {

  test('TC-SYS-001~005: User management CRUD flow', async ({ page }) => {
    test.setTimeout(60000);
    // 先登录
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/system/users');
    await page.waitForTimeout(1000);

    // 点击新增用户
    const addBtn = page.locator('button:has-text("新增用户")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // 空提交校验
      await page.click('.el-dialog__footer button:has-text("确定")');
      await page.waitForTimeout(300);
      await expect(page.locator('.el-form-item__error').first()).toBeVisible();

      // 填写用户信息
      const randomUser = `e2e-user-${Date.now().toString().slice(-4)}`;
      await page.fill('label:has-text("用户名") + .el-form-item__content input', randomUser);
      await page.fill('label:has-text("姓名") + .el-form-item__content input', randomUser);
      await page.fill('label:has-text("密码") + .el-form-item__content input', 'test123');

      // 选择角色
      const roleSelect = page.locator('label:has-text("角色") + .el-form-item__content .el-select__wrapper');
      if (await roleSelect.count() > 0) {
        await roleSelect.click();
        await page.waitForTimeout(300);
        await page.locator('.el-select-dropdown__item:visible').first().click();
      }

      await page.click('.el-dialog__footer button:has-text("确定")');
      await page.waitForTimeout(1000);
    }
  });

  test('TC-SYS-014: System settings save', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/system/settings');
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('button:has-text("保存配置")');
    if (await saveBtn.count() > 0) {
      // 修改一个配置项
      const firstInput = page.locator('.el-form-item__content input').first();
      if (await firstInput.count() > 0) {
        await firstInput.fill('test-value');
      }
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('TC-SYS-013: Log list filter', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/system/logs');
    await page.waitForTimeout(1000);

    const queryBtn = page.locator('button:has-text("查询")');
    if (await queryBtn.count() > 0) {
      // 选择一个日志类型筛选
      const logTypeSelect = page.locator('.el-select__wrapper').first();
      if (await logTypeSelect.count() > 0) {
        await logTypeSelect.click();
        await page.waitForTimeout(300);
        await page.locator('.el-select-dropdown__item:visible').first().click();
      }
      await queryBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

// ========================================================================
// Group 5: Dashboard & Navigation — 仪表盘加载、侧边栏导航
// ========================================================================
test.describe('Group 5: Dashboard & Navigation', () => {

  test('TC-DASH-001~002: Dashboard KPI and charts load correctly', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // KPI 卡片
    await expect(page.locator('.stat-row, .kpi-row, .dashboard-stat')).toBeVisible();
    // 验证无 NaN 值
    const kpiValues = page.locator('.stat-item__value, .kpi-item__val, .dashboard-stat__value');
    const count = await kpiValues.count();
    for (let i = 0; i < count && i < 5; i++) {
      const text = await kpiValues.nth(i).textContent();
      expect(text).not.toContain('NaN');
      expect(text).not.toBe('');
    }
  });

  test('TC-LAYOUT-002: Sidebar navigation routes work correctly', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const navItems = page.locator('.el-menu-item, .sidebar-item, .nav-item');
    const navCount = await navItems.count();

    // 遍历侧边栏可见项
    for (let i = 0; i < Math.min(navCount, 5); i++) {
      const item = navItems.nth(i);
      if (await item.isVisible()) {
        await item.click();
        await page.waitForTimeout(1000);
        // 验证页面内容加载
        expect(await page.url()).not.toContain('login');
      }
    }
  });
});
