import { test, expect } from '@playwright/test'
import { setupApiMocks, loginAsAdmin } from './mock-data'

/** Helper: login via UI, then navigate to target path */
async function loginAndGo(page: any, path: string) {
  await setupApiMocks(page)
  await loginAsAdmin(page)
  if (path !== '/dashboard') {
    await page.goto(path)
  }
}

/* ========================================
   Login Page
   ======================================== */
test.describe('登录页', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/login')
  })

  test('应渲染登录表单', async ({ page }) => {
    await expect(page.locator('.login-card')).toBeVisible()
    await expect(page.locator('h2')).toContainText('YT-MES')
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible()
    await expect(page.getByRole('button', { name: '登 录' })).toBeVisible()
  })

  test('空表单提交应显示校验提示', async ({ page }) => {
    await page.getByRole('button', { name: '登 录' }).click()
    await expect(page.locator('.el-form-item__error')).toHaveCount(2)
  })

  test('登录失败应显示错误信息', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: '用户名或密码错误' }) })
    })
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'wrong')
    await page.getByRole('button', { name: '登 录' }).click()
    await expect(page.locator('.login-error')).toContainText('用户名或密码错误')
  })

  test('登录成功应跳转到仪表盘', async ({ page }) => {
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.getByRole('button', { name: '登 录' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

/* ========================================
   Dashboard
   ======================================== */
test.describe('仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/dashboard')
  })

  test('应显示统计卡片和批次表格', async ({ page }) => {
    const statCards = page.locator('.stat-card')
    await expect(statCards).toHaveCount(4)
    await expect(statCards.first()).toContainText('批次总数')
    await expect(page.locator('.el-table')).toBeVisible()
  })

  test('点击批次行应跳转到详情', async ({ page }) => {
    await page.getByText('WT26A01MA').first().click()
    await expect(page).toHaveURL(/\/batches\/WT26A01MA/)
  })
})

/* ========================================
   Batch Management
   ======================================== */
test.describe('批次管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/batches')
  })

  test('应显示批次列表', async ({ page }) => {
    await expect(page.getByText('批次管理').first()).toBeVisible()
    await expect(page.getByText('WT26A01MA').first()).toBeVisible()
  })

  test('新建批次对话框可正常操作', async ({ page }) => {
    await page.getByRole('button', { name: '新建批次' }).click()
    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input').nth(0).fill('TEST-BATCH-001')
    await dialog.locator('input').nth(1).fill('M1-TEST')
    await dialog.locator('input').nth(2).fill('2000mAh')
    await dialog.locator('input').nth(3).fill('测试车间')
    await dialog.locator('.el-select').click()
    await page.locator('.el-select-dropdown__item').first().click()
    await dialog.locator('.el-date-editor').click()
    await page.locator('.el-date-table-cell').first().click()
    await dialog.getByRole('button', { name: '确定' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('点击批次行跳转到详情页', async ({ page }) => {
    await page.getByText('WT26A01MA').first().click()
    await expect(page).toHaveURL(/\/batches\/WT26A01MA/)
  })
})

/* ========================================
   Batch Detail
   ======================================== */
test.describe('批次详情', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/batches/WT26A01MA')
  })

  test('应显示批次基本信息', async ({ page }) => {
    await expect(page.getByText('批次详情')).toBeVisible()
    await expect(page.locator('.el-descriptions')).toBeVisible()
  })

  test('工序选项卡应包含工序卡片', async ({ page }) => {
    await expect(page.locator('.proc-card').first()).toBeVisible()
    await expect(page.getByText('配料').first()).toBeVisible()
  })

  test('电芯列表选项卡可切换', async ({ page }) => {
    await page.getByText('电芯列表').click()
    await expect(page.getByText('CELL001').first()).toBeVisible()
  })

  test('相关操作按钮可点击', async ({ page }) => {
    await expect(page.getByRole('button', { name: '质量检验' })).toBeVisible()
    await expect(page.getByRole('button', { name: '材料仓库' })).toBeVisible()
    await expect(page.getByRole('button', { name: '电芯追溯' })).toBeVisible()
  })
})

/* ========================================
   Cell Trace Page
   ======================================== */
test.describe('电芯追溯', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/cells/CELL001/trace')
  })

  test('应显示搜索栏和空闲态', async ({ page }) => {
    await expect(page.locator('.search-bar')).toBeVisible()
    await expect(page.locator('.idle-state')).toBeVisible()
  })

  test('模式切换按钮可点击', async ({ page }) => {
    const buttons = page.locator('.search-bar__mode')
    await expect(buttons).toHaveCount(2)
    await buttons.nth(1).click()
    await expect(buttons.nth(1)).toHaveClass(/active/)
    await expect(page.locator('input[placeholder="输入批次号"]')).toBeVisible()
  })

  test('搜索失败应显示错误状态', async ({ page }) => {
    await page.route('**/api/cells/**/trace', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: '未找到该电芯条码' }) })
    })
    await page.locator('.search-bar input').fill('INVALID')
    await page.getByRole('button', { name: '追溯查询' }).click()
    await expect(page.locator('.error-state')).toBeVisible()
    await page.getByRole('button', { name: '重新搜索' }).click()
    await expect(page.locator('.idle-state')).toBeVisible()
  })

  test('搜索成功应显示KPI卡片和工序导航', async ({ page }) => {
    await page.locator('.search-bar input').fill('CELL001')
    await page.getByRole('button', { name: '追溯查询' }).click()
    await expect(page.locator('.kpi-cards')).toBeVisible()
    await expect(page.locator('.kpi-card')).toHaveCount(4)
    await expect(page.locator('.process-nav')).toBeVisible()
    await expect(page.locator('.pipeline-bar')).toBeVisible()
    await expect(page.locator('.barcode-display')).toBeVisible()
    await expect(page.locator('.barcode-display__value')).toContainText('CELL001')
  })

  test('点击工序节点应显示工序详情', async ({ page }) => {
    await page.locator('.search-bar input').fill('CELL001')
    await page.getByRole('button', { name: '追溯查询' }).click()
    await page.waitForSelector('.process-nav__item')
    await page.locator('.process-nav__item').first().click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel__header')).toContainText('配料')
    await expect(page.locator('.detail-group')).toHaveCount(2)
  })

  test('进度信息应显示', async ({ page }) => {
    await page.locator('.search-bar input').fill('CELL001')
    await page.getByRole('button', { name: '追溯查询' }).click()
    await expect(page.locator('.process-nav__progress-text')).toContainText('13')
  })

  test('批次模式搜索应显示批次信息和电芯列表', async ({ page }) => {
    await page.locator('.search-bar__mode').nth(1).click()
    await page.locator('.search-bar input').fill('WT26A01MA')
    await page.getByRole('button', { name: '追溯查询' }).click()
    await expect(page.locator('.info-card')).toBeVisible()
    await expect(page.locator('.cell-table')).toBeVisible()
  })
})

/* ========================================
   Cell Barcode Import
   ======================================== */
test.describe('电芯条码管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/cells')
  })

  test('应显示导入表单和导入记录', async ({ page }) => {
    await expect(page.locator('.import-card')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('.list-card')).toBeVisible()
    await expect(page.locator('.el-table')).toBeVisible()
  })

  test('导入空条码应显示警告', async ({ page }) => {
    await page.fill('input[placeholder="请输入批次号"]', 'WT26A01MA')
    await page.getByRole('button', { name: '批量导入' }).click()
    await expect(page.locator('.el-message--warning')).toBeVisible()
  })

  test('导入多条码应成功', async ({ page }) => {
    await page.fill('input[placeholder="请输入批次号"]', 'WT26A01MA')
    await page.fill('textarea', 'BARCODE-A\nBARCODE-B\nBARCODE-C')
    await page.getByRole('button', { name: '批量导入' }).click()
    await expect(page.locator('.el-message--success')).toBeVisible()
  })
})

/* ========================================
   13 道工序页面
   ======================================== */
test.describe('工序页面', () => {
  const PROCESSES = [
    { path: 'batching', name: '配料' },
    { path: 'coating', name: '涂布' },
    { path: 'roller-pressing', name: '辊压' },
    { path: 'slitting', name: '分切' },
    { path: 'electrode', name: '制片' },
    { path: 'winding', name: '卷绕' },
    { path: 'assembly', name: '装配' },
    { path: 'baking', name: '烘烤' },
    { path: 'injection', name: '注液' },
    { path: 'wrapping', name: '顶封' },
    { path: 'formation', name: '化成' },
    { path: 'grading', name: '分容' },
    { path: 'sorting', name: '分选' },
  ]

  PROCESSES.forEach((proc) => {
    test(`${proc.name}(${proc.path})页面应正常渲染`, async ({ page }) => {
      await loginAndGo(page, `/processes/WT26A01MA/${proc.path}`)
      await expect(page.getByText(proc.name).first()).toBeVisible()
      await expect(page.getByText('操作员填写')).toBeVisible()
    })
  })

  test('保存草稿应成功', async ({ page }) => {
    await loginAndGo(page, '/processes/WT26A01MA/batching')
    await page.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(500)
  })
})

/* ========================================
   Quality Check
   ======================================== */
test.describe('质量检验', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/quality/WT26A01MA')
  })

  test('应显示检验记录列表', async ({ page }) => {
    await expect(page.getByText('质量检验')).toBeVisible()
    await expect(page.locator('.el-table')).toBeVisible()
    await expect(page.getByText('质检员A').first()).toBeVisible()
  })

  test('创建检验记录对话框可正常操作', async ({ page }) => {
    await page.getByRole('button', { name: '创建检验' }).click()
    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('.el-select').first().click()
    await page.locator('.el-select-dropdown__item').first().click()
    await dialog.locator('label').filter({ hasText: '合格' }).first().click()
    await dialog.locator('input[placeholder="请输入检验员姓名"]').fill('测试员')
    await dialog.getByRole('button', { name: '提交' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('不合格时缺陷字段应出现', async ({ page }) => {
    await page.getByRole('button', { name: '创建检验' }).click()
    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('label').filter({ hasText: '不合格' }).first().click()
    await expect(dialog.getByText('缺陷数量')).toBeVisible()
  })
})

/* ========================================
   Material Warehouse
   ======================================== */
test.describe('材料仓库', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/materials/WT26A01MA')
  })

  test('应显示材料列表', async ({ page }) => {
    await expect(page.getByText('材料仓库')).toBeVisible()
    await expect(page.locator('.el-table')).toBeVisible()
  })

  test('添加材料对话框可正常操作', async ({ page }) => {
    await page.getByRole('button', { name: '添加材料' }).click()
    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('.el-select').click()
    await page.locator('.el-select-dropdown__item').first().click()
    await dialog.locator('input[placeholder="请输入合格入仓材料批次号"]').fill('SUP-TEST')
    await dialog.locator('input[placeholder="请输入仓库人员姓名"]').fill('测试员')
    // Interact with the quantity spinbutton to trigger validation
    await dialog.getByRole('button', { name: '增加数值' }).click()
    await dialog.getByRole('button', { name: '减少数值' }).click()
    await dialog.getByRole('button', { name: '确定' }).click()
    await expect(dialog).not.toBeVisible()
  })
})

/* ========================================
   Navigation & Layout
   ======================================== */
test.describe('导航与布局', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/dashboard')
  })

  test('侧边栏菜单项应存在', async ({ page }) => {
    await expect(page.locator('.app-aside')).toBeVisible()
    await expect(page.locator('.app-aside').getByText('YT-MES')).toBeVisible()
  })

  test('顶部栏应显示用户信息和退出登录', async ({ page }) => {
    await expect(page.locator('.header-title')).toContainText('电芯生产追溯系统')
    await expect(page.locator('.user-info')).toContainText('admin')
    await page.locator('.user-info').click()
    await expect(page.locator('.el-dropdown-menu')).toBeVisible()
    await expect(page.getByText('退出登录')).toBeVisible()
  })

  test('退出登录应跳转到登录页', async ({ page }) => {
    await page.locator('.user-info').click()
    await page.getByText('退出登录').click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('.login-card')).toBeVisible()
  })
})

/* ========================================
   Responsive & States
   ======================================== */
test.describe('响应式与状态', () => {
  test('未登录应重定向到登录页', async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('移动端视图(768px)布局应自适应', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await loginAndGo(page, '/dashboard')
    await expect(page.locator('.stat-card').first()).toBeVisible()
  })

  test('平板视图(1024px)应正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await loginAndGo(page, '/batches')
    await expect(page.getByText('WT26A01MA').first()).toBeVisible()
  })
})
