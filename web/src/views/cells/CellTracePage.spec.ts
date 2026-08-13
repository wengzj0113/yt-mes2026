import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import CellTracePage from './CellTracePage.vue'

const mockCellTrace = vi.hoisted(() => ({
  data: {
    cell: {
      barcode: 'CELL001',
      batchNo: 'WT26A01MA',
      voltage: 3.7,
      internalResistance: 18,
      capacity: 2500,
      grade: 'A',
      importSource: '产线1',
      importedAt: '2026-01-01T10:00:00',
    },
    batch: {
      batchNo: 'WT26A01MA',
      productModel: 'M1',
      productSpec: 'S1',
      status: 2,
      plannedQty: 1000,
      createdAt: '2026-01-01T08:00:00',
    },
    processes: {
      batching: { isDraft: false, recordStatus: 1, operatorName: '张三' },
    },
  },
  success: true,
  message: 'ok',
}))

const mockBatchInfo = vi.hoisted(() => ({
  data: { batchNo: 'WT26A01MA', productModel: 'M1', productSpec: 'S1', status: 2, plannedQty: 1000, createdAt: '2026-01-01T08:00:00' },
  success: true,
  message: 'ok',
}))

const mockProcessRecords = vi.hoisted(() => ({
  data: {
    batching: { isDraft: false, recordStatus: 1, operatorName: '张三' },
  },
  success: true,
  message: 'ok',
}))

const mockCellList = vi.hoisted(() => ({
  data: [
    { barcode: 'CELL001', grade: 'A', voltage: 3.7, internalResistance: 18, capacity: 2500, importedAt: '2026-01-01T10:00:00' },
    { barcode: 'CELL002', grade: 'B', voltage: 3.65, internalResistance: 22, capacity: 2400, importedAt: '2026-01-01T10:05:00' },
  ],
  meta: { total: 2, page: 1, pageSize: 20 },
  success: true,
  message: 'ok',
}))

const pushFn = vi.fn()
const routeQuery = vi.hoisted(() => ({ current: {} as Record<string, string> }))

vi.mock('@/api/cells', () => ({
  cellApi: {
    trace: vi.fn().mockResolvedValue(mockCellTrace),
    findByBatch: vi.fn().mockResolvedValue(mockCellList),
  },
}))

vi.mock('@/api/batch', () => ({
  batchApi: {
    getByNo: vi.fn().mockResolvedValue(mockBatchInfo),
    getProcessRecords: vi.fn().mockResolvedValue(mockProcessRecords),
  },
}))

vi.mock('@/api/process-dictionary', () => ({
  processDictionaryApi: {
    list: vi.fn().mockResolvedValue({
      data: { items: [], meta: { total: 0, page: 1, pageSize: 100 } },
      success: true,
      message: 'ok',
    }),
  },
}))

vi.mock('@/api/pack', () => ({
  getPackByBarcode: vi.fn().mockResolvedValue({ data: null, success: true, message: 'ok' }),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: pushFn }),
    useRoute: () => ({ query: routeQuery.current }),
  }
})

async function waitForUi() {
  await flushPromises()
  await nextTick()
}

describe('CellTracePage', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    routeQuery.current = {}
    vi.clearAllMocks()
  })

  it('renders idle search UI', () => {
    const wrapper = mount(CellTracePage, {
      global: { plugins: [pinia], stubs: { 'el-icon': true } },
    })
    expect(wrapper.find('.search-container').exists()).toBe(true)
    expect(wrapper.text()).toContain('生产追溯中心')
    expect(wrapper.text()).toContain('电芯')
    expect(wrapper.text()).toContain('批次')
    expect(wrapper.text()).toContain('Pack')
  })

  it('switches mode tabs and updates placeholder', async () => {
    const wrapper = mount(CellTracePage, {
      global: { plugins: [pinia], stubs: { 'el-icon': true } },
    })
    const tabs = wrapper.findAll('.search-tab')
    await tabs[1].trigger('click')
    await nextTick()
    expect((wrapper.find('.search-box__input-group input').element as HTMLInputElement).placeholder).toContain('批次')
  })

  it('traces by barcode and shows result', async () => {
    const wrapper = mount(CellTracePage, {
      global: { plugins: [pinia], stubs: { 'el-icon': true } },
    })
    const input = wrapper.find('.search-box__input-group input')
    await input.setValue('CELL001')
    await wrapper.find('button.apple-button').trigger('click')
    await waitForUi()
    const { cellApi } = await import('@/api/cells')
    expect(cellApi.trace).toHaveBeenCalled()
    expect(wrapper.text()).toContain('SN: CELL001')
    expect(wrapper.text()).toContain('所属批次: WT26A01MA')
  })

  it('traces by batch and shows cell list', async () => {
    const wrapper = mount(CellTracePage, {
      global: { plugins: [pinia], stubs: { 'el-icon': true } },
    })
    const tabs = wrapper.findAll('.search-tab')
    await tabs[1].trigger('click')
    await nextTick()

    const input = wrapper.find('.search-box__input-group input')
    await input.setValue('WT26A01MA')
    await wrapper.find('button.apple-button').trigger('click')
    await waitForUi()
    expect(wrapper.text()).toContain('批次电芯档案清单')
    expect(wrapper.text()).toContain('CELL001')
  })
})

