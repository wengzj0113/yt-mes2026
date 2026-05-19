import { type Page } from '@playwright/test'

/* ========================================
   Mock Data
   ======================================== */

export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDB9.mock'

export const MOCK_BATCHES = {
  success: true,
  data: {
    items: [
      { id: 1, batchNo: 'WT26A01MA', productModel: 'M1-18650', productSpec: '2600mAh', plannedQty: 5000, status: 2, createdBy: 1, createdAt: '2026-05-10T08:00:00' },
      { id: 2, batchNo: 'WT26A02MB', productModel: 'M2-21700', productSpec: '4000mAh', plannedQty: 8000, status: 3, createdBy: 1, createdAt: '2026-05-09T10:30:00' },
      { id: 3, batchNo: 'WT26A03MC', productModel: 'M1-18650', productSpec: '2600mAh', plannedQty: 3000, status: 1, createdBy: 2, createdAt: '2026-05-08T14:15:00' },
      { id: 4, batchNo: 'WT26A04MD', productModel: 'M3-26650', productSpec: '5000mAh', plannedQty: 2000, status: 4, createdBy: 1, createdAt: '2026-05-07T09:45:00' },
    ],
    meta: { total: 4, page: 1, pageSize: 20, totalPages: 1 },
  },
  message: 'ok',
}

export const MOCK_BATCH_DETAIL = {
  success: true,
  data: { id: 1, batchNo: 'WT26A01MA', productModel: 'M1-18650', productSpec: '2600mAh', plannedQty: 5000, status: 2, createdBy: 1, createdAt: '2026-05-10T08:00:00' },
  message: 'ok',
}

export const MOCK_PROCESS_STATUS = {
  success: true,
  data: [
    { processKey: 'batching', processName: '配料', route: 'batching', status: 'submitted', isDraft: false, recordStatus: 1, updatedAt: '2026-05-10T10:00:00' },
    { processKey: 'coating', processName: '涂布', route: 'coating', status: 'draft', isDraft: true, recordStatus: 1, updatedAt: '2026-05-10T12:00:00' },
    { processKey: 'roller-pressing', processName: '辊压', route: 'roller-pressing', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'slitting', processName: '分切', route: 'slitting', status: 'submitted', isDraft: false, recordStatus: 2, updatedAt: '2026-05-10T14:00:00' },
    { processKey: 'electrode', processName: '制片', route: 'electrode', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'winding', processName: '卷绕', route: 'winding', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'assembly', processName: '装配', route: 'assembly', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'baking', processName: '烘烤', route: 'baking', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'injection', processName: '注液', route: 'injection', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'wrapping', processName: '顶封', route: 'wrapping', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'formation', processName: '化成', route: 'formation', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'grading', processName: '分容', route: 'grading', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
    { processKey: 'sorting', processName: '分选', route: 'sorting', status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null },
  ],
  message: 'ok',
}

export const MOCK_PROCESS_RECORDS = {
  success: true,
  data: {
    batching: { isDraft: false, recordStatus: 1, positiveMaterial: 'NCM-811', negativeMaterial: 'Graphite-A', viscosityRecord: '1800mPa·s', operatorName: '张三', batchNo: 'WT26A01MA', createdAt: '2026-05-10T10:00:00' },
    coating: { isDraft: true, recordStatus: 1, equipmentCode: 'CT-001', coatingSpeed: 12.5, coatingTemperature: 85, coatingThicknessPos: 150, coatingThicknessNeg: 120, arealDensityPos: 180, arealDensityNeg: 160, operatorName: '李四', batchNo: 'WT26A01MA', createdAt: '2026-05-10T12:00:00' },
    slitting: { isDraft: false, recordStatus: 2, equipmentCode: 'SL-001', slittingSpeed: 45, electrodeWidth: 150, electrodeLength: 300, operatorName: '赵六', batchNo: 'WT26A01MA', createdAt: '2026-05-10T14:30:00' },
  },
  message: 'ok',
}

export const MOCK_CELL_TRACE = {
  success: true,
  data: {
    cell: { barcode: 'CELL001', batchNo: 'WT26A01MA', voltage: 3.7, internalResistance: 18, capacity: 2500, grade: 'A', importSource: '产线1', importedAt: '2026-05-10T10:00:00' },
    batch: { batchNo: 'WT26A01MA', productModel: 'M1-18650', productSpec: '2600mAh', status: 2, plannedQty: 5000, createdAt: '2026-05-10T08:00:00' },
    processes: {
      batching: { isDraft: false, recordStatus: 1, positiveMaterial: 'NCM-811', negativeMaterial: 'Graphite-A', operatorName: '张三' },
      coating: { isDraft: true, recordStatus: 1, equipmentCode: 'CT-001', coatingSpeed: 12.5, operatorName: '李四' },
      'roller-pressing': { isDraft: false, recordStatus: 1, rollerPressure: 50, operatorName: '王五' },
      slitting: { isDraft: false, recordStatus: 2, equipmentCode: 'SL-001', slittingSpeed: 45, operatorName: '赵六' },
      electrode: null, winding: null, assembly: null, baking: null, injection: null, wrapping: null, formation: null, grading: null, sorting: null,
    },
  },
  message: 'ok',
}

export const MOCK_CELL_LIST = {
  success: true,
  data: [
    { barcode: 'CELL001', batchNo: 'WT26A01MA', grade: 'A', voltage: 3.7, internalResistance: 18, capacity: 2500, importSource: '产线1', importedAt: '2026-05-10T10:00:00' },
    { barcode: 'CELL002', batchNo: 'WT26A01MA', grade: 'B', voltage: 3.65, internalResistance: 22, capacity: 2400, importSource: '产线1', importedAt: '2026-05-10T10:05:00' },
    { barcode: 'CELL003', batchNo: 'WT26A01MA', grade: 'A', voltage: 3.72, internalResistance: 16, capacity: 2510, importSource: '产线1', importedAt: '2026-05-10T10:10:00' },
  ],
  meta: { total: 3, page: 1, pageSize: 20, totalPages: 1 },
  message: 'ok',
}

export const MOCK_QUALITY_CHECKS = {
  success: true,
  data: [
    { id: 1, batchNo: 'WT26A01MA', processType: 'batching', inspectionResult: 1, defectQty: 0, defectReason: null, inspectorName: '质检员A', abnormalRecord: null, createdAt: '2026-05-10T11:00:00' },
    { id: 2, batchNo: 'WT26A01MA', processType: 'slitting', inspectionResult: 2, defectQty: 5, defectReason: '极片边缘毛刺超标', inspectorName: '质检员B', abnormalRecord: '已标记返工', createdAt: '2026-05-10T15:00:00' },
  ],
  message: 'ok',
}

export const MOCK_MATERIALS = {
  success: true,
  data: [
    { id: 1, batchNo: 'WT26A01MA', materialType: 1, supplierBatchNo: 'SUP-2026-001', warehousePerson: '王仓库', status: 1, quantity: 500, unit: 'kg', createdAt: '2026-05-09T08:00:00' },
    { id: 2, batchNo: 'WT26A01MA', materialType: 3, supplierBatchNo: 'SUP-2026-002', warehousePerson: '李仓库', status: 2, quantity: 200, unit: 'kg', createdAt: '2026-05-09T09:00:00' },
  ],
  message: 'ok',
}

export const MOCK_EMPTY = { success: true, data: [], message: 'ok' }

export const MOCK_PROCESS_DRAFT = {
  success: true,
  data: { id: 1, batchNo: 'WT26A01MA', isDraft: true, positiveMaterial: 'NCM-811', operatorName: '张三', createdAt: '2026-05-10T10:00:00' },
  message: 'ok',
}

export const MOCK_PROCESS_SUBMIT = {
  success: true,
  data: { id: 1, batchNo: 'WT26A01MA', isDraft: false, operatorName: '张三', viscosityRecord: '1800mPa·s', recordStatus: 1 },
  message: 'ok',
}

/* ========================================
   Route Interceptor Setup
   ======================================== */

const JSON_HEADERS = { 'content-type': 'application/json' }

export async function setupApiMocks(page: Page, options?: {
  delayMs?: number
  failOn?: string[]
}) {
  const { delayMs = 0, failOn = [] } = options || {}

  // Helper to conditionally fail a route
  function mockResponse(urlContains: string, data: any) {
    return page.route(urlContains, async (route) => {
      const shouldFail = failOn.some((f) => route.request().url().includes(f))
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
      if (shouldFail) {
        await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
      } else {
        await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(data) })
      }
    })
  }

  // Auth
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: true,
        data: { accessToken: MOCK_TOKEN, refreshToken: MOCK_TOKEN, user: { id: 1, username: 'admin', realName: '管理员', roleCode: 4 } },
        message: 'ok',
      }),
    })
  })

  // Batches
  // Note: Use regex to handle query params (e.g. /api/batches?page=1&pageSize=10)
  await page.route(/\/api\/batches(\?.*)?$/, async (route) => {
    const shouldFail = failOn.some((f) => route.request().url().includes(f))
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    if (shouldFail) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_BATCHES) })
    }
  })
  await page.route(/\/api\/batches\/[^/]+(\?.*)?$/, async (route) => {
    const shouldFail = failOn.some((f) => route.request().url().includes(f))
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    if (shouldFail) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_BATCH_DETAIL) })
    }
  })

  // Processes — use regex to match endpoints with batch numbers (e.g. /api/processes/status/WT26A01MA)
  await page.route(/\/api\/processes\/status\/[^/]+(\?.*)?$/, async (route) => {
    const shouldFail = failOn.some((f) => route.request().url().includes(f))
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    if (shouldFail) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_STATUS) })
    }
  })
  await page.route(/\/api\/processes\/records\/[^/]+(\?.*)?$/, async (route) => {
    const shouldFail = failOn.some((f) => route.request().url().includes(f))
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    if (shouldFail) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_RECORDS) })
    }
  })

  // Process form (dynamic path: /api/processes/:process/:batchNo)
  await page.route(/\/api\/processes\/(batching|coating|roller-pressing|slitting|electrode|winding|assembly|baking|injection|wrapping|formation|grading|sorting)\/([^/]+)$/, async (route) => {
    const url = route.request().url()
    if (failOn.some((f) => url.includes(f))) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: '模拟错误' }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_DRAFT) })
    }
  })

  // Process draft submit
  await page.route('**/draft', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_DRAFT) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_DRAFT) })
    }
  })

  // Process quality submit
  await page.route('**/submit', async (route) => {
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_PROCESS_SUBMIT) })
  })

  // Cells - trace
  await mockResponse('**/api/cells/**/trace', MOCK_CELL_TRACE)

  // Cells - batch barcodes (with pagination params)
  await page.route(/\/api\/cells\/batch\/[^/]+\/barcodes(\?.*)?$/, async (route) => {
    const shouldFail = failOn.some((f) => route.request().url().includes(f))
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    if (shouldFail) {
      await route.fulfill({ status: 500, headers: JSON_HEADERS, body: JSON.stringify({ success: false, message: `模拟错误: ${route.request().url()}` }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_CELL_LIST) })
    }
  })

  // Cells - batch import
  await page.route('**/api/cells/barcodes', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true, data: [{ barcode: 'NEW001' }, { barcode: 'NEW002' }], message: 'ok' }) })
    } else {
      await mockResponse('**/api/cells/barcodes', MOCK_CELL_LIST)
    }
  })

  // Quality checks
  await mockResponse('**/api/batches/*/quality-checks', MOCK_QUALITY_CHECKS)

  // Materials
  await page.route(/\/api\/batches\/[^/]+\/materials(\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true, data: { id: 3 }, message: 'ok' }) })
    } else {
      await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_MATERIALS) })
    }
  })

  // Auth refresh (should not be called in normal flow)
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true, data: { accessToken: MOCK_TOKEN }, message: 'ok' }) })
  })
}

/* ========================================
   Auth Helper
   ======================================== */

export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.waitForSelector('.login-card')
  await page.fill('input[placeholder="用户名"]', 'admin')
  await page.fill('input[placeholder="密码"]', 'admin123')
  await page.click('button:has-text("登 录")')
  await page.waitForURL(/\/dashboard/)
}

export async function loginWithSession(page: Page) {
  // Use addInitScript to set localStorage BEFORE the app loads
  // This ensures the Pinia auth store reads the token on creation
  await page.addInitScript((token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', token)
  }, MOCK_TOKEN)
}
