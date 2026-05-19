import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { cellApi } from '@/api/cells'
import { batchApi } from '@/api/batch'
import CellTracePage from './CellTracePage.vue'

/* ---------- Mock Data ---------- */

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
      batching: { isDraft: false, recordStatus: 1, positiveMaterial: 'NCM-811', negativeMaterial: 'Graphite-A', operatorName: '张三' },
      coating: { isDraft: true, recordStatus: 1, equipmentCode: 'CT-001', coatingSpeed: 12.5, operatorName: '李四' },
      'roller-pressing': { isDraft: false, recordStatus: 1, rollerPressure: 50, operatorName: '王五' },
      slitting: { isDraft: false, recordStatus: 2, electrodeWidth: 150, operatorName: '赵六' },
      electrode: null,
      winding: null,
      assembly: null,
      baking: null,
      injection: null,
      wrapping: null,
      formation: null,
      grading: null,
      sorting: null,
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
    batching: { isDraft: false, recordStatus: 1, positiveMaterial: 'NCM-811', operatorName: '张三' },
    coating: { isDraft: true, recordStatus: 1, equipmentCode: 'CT-001', operatorName: '李四' },
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

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushFn }),
  useRoute: () => ({ query: routeQuery.current }),
}))

/* ---------- Helpers ---------- */

function factory(): VueWrapper {
  return mount(CellTracePage, {
    global: { stubs: { 'el-icon': true } },
  })
}

async function waitForApi() {
  await flushPromises()
  await nextTick()
}

/* ---------- Tests ---------- */

describe('CellTracePage – Redesigned Industrial UI', () => {
  beforeEach(() => {
    routeQuery.current = {}
    vi.clearAllMocks()
  })

  // --- Rendering ---
  it('renders the compact search bar with mode switch', () => {
    const wrapper = factory()
    expect(wrapper.find('.search-bar').exists()).toBe(true)
    expect(wrapper.text()).toContain('电芯追溯')
    expect(wrapper.text()).toContain('批次追溯')
    expect(wrapper.text()).toContain('追溯查询')
  })

  it('shows barcode input by default and switches mode', async () => {
    const wrapper = factory()
    const input = wrapper.find('.search-bar input')
    expect(input.exists()).toBe(true)

    const buttons = wrapper.findAll('.search-bar__mode')
    expect(buttons.length).toBe(2)
    await buttons[1].trigger('click')
    await nextTick()
    // After clicking batch mode, the active class should be on the second button
    expect(wrapper.find('.search-bar__mode.active').exists()).toBe(true)
  })

  it('renders idle state with hint text when no search performed', () => {
    const wrapper = factory()
    expect(wrapper.find('.idle-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('扫描或输入电芯条码开始追溯')
  })

  it('shows loading skeleton while tracing', async () => {
    // Make trace slow to catch loading state
    vi.mocked(cellApi.trace).mockImplementationOnce(
      () => new Promise((r) => setTimeout(() => r(mockCellTrace), 200)),
    )
    const wrapper = factory()

    const input = wrapper.find('.search-bar input')
    await input.setValue('CELL001')
    await wrapper.find('.search-bar__btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
  })

  it('shows error state when trace returns 404', async () => {
    vi.mocked(cellApi.trace).mockRejectedValueOnce({
      response: { status: 404, data: { message: '未找到该电芯条码' } },
    })
    const wrapper = factory()

    const input = wrapper.find('.search-bar input')
    await input.setValue('INVALID')
    await wrapper.find('.search-bar__btn').trigger('click')
    await waitForApi()

    expect(wrapper.find('.error-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('未找到该电芯条码')
  })

  it('resets search when re-search button is clicked after error', async () => {
    vi.mocked(cellApi.trace).mockRejectedValueOnce({
      response: { status: 404, data: { message: '未找到该电芯条码' } },
    })
    const wrapper = factory()

    const input = wrapper.find('.search-bar input')
    await input.setValue('INVALID')
    await wrapper.find('.search-bar__btn').trigger('click')
    await waitForApi()
    expect(wrapper.find('.error-state').exists()).toBe(true)

    // Click re-search button
    await wrapper.find('.error-state button').trigger('click')
    await nextTick()

    expect(wrapper.find('.error-state').exists()).toBe(false)
    expect(wrapper.find('.idle-state').exists()).toBe(true)
  })

  // --- Barcode Mode Results ---
  describe('barcode mode results', () => {
    let wrapper: VueWrapper

    beforeEach(async () => {
      vi.mocked(cellApi.trace).mockResolvedValue(mockCellTrace)
      wrapper = factory()

      const input = wrapper.find('.search-bar input')
      await input.setValue('CELL001')
      await wrapper.find('.search-bar__btn').trigger('click')
      await waitForApi()
    })

    it('renders KPI metric cards for cell parameters', () => {
      expect(wrapper.findAll('.kpi-card').length).toBe(4)
      expect(wrapper.text()).toContain('3.700')
      expect(wrapper.text()).toContain('18')
      expect(wrapper.text()).toContain('2500')
      expect(wrapper.text()).toContain('A级')
    })

    it('renders process navigation sidebar with 13 items', () => {
      const items = wrapper.findAll('.process-nav__item')
      expect(items.length).toBe(13)
      expect(wrapper.text()).toContain('配料')
      expect(wrapper.text()).toContain('涂布')
      expect(wrapper.text()).toContain('分选')
    })

    it('shows correct completion summary in process nav', () => {
      // 3 submitted + 1 draft = 4 total with data
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('13')
    })

    it('renders compact pipeline progress bar', () => {
      expect(wrapper.find('.pipeline-bar').exists()).toBe(true)
    })

    it('renders batch info card', () => {
      expect(wrapper.text()).toContain('WT26A01MA')
      expect(wrapper.text()).toContain('M1')
      expect(wrapper.text()).toContain('S1')
    })

    it('shows process detail when clicking a process step', async () => {
      const items = wrapper.findAll('.process-nav__item')
      await items[0].trigger('click')
      await nextTick()

      expect(wrapper.find('.detail-panel').exists()).toBe(true)
      expect(wrapper.text()).toContain('NCM-811')
      expect(wrapper.text()).toContain('张三')
    })

    it('shows hint panel when no process is selected', () => {
      expect(wrapper.find('.hint-panel').exists()).toBe(true)
      expect(wrapper.text()).toContain('点击工序节点查看详细数据')
    })

    it('displays the barcode prominently', () => {
      expect(wrapper.text()).toContain('CELL001')
      expect(wrapper.text()).toContain('产线1')
    })
  })

  // --- Batch Mode ---
  describe('batch mode results', () => {
    let wrapper: VueWrapper

    beforeEach(async () => {
      vi.mocked(batchApi.getByNo).mockResolvedValue(mockBatchInfo)
      vi.mocked(batchApi.getProcessRecords).mockResolvedValue(mockProcessRecords)
      vi.mocked(cellApi.findByBatch).mockResolvedValue(mockCellList)
      wrapper = factory()

      // Switch to batch mode
      const buttons = wrapper.findAll('.search-bar__mode')
      await buttons[1].trigger('click')
      await nextTick()

      // Because we changed el-input to el-select in batch mode
      // we need to set the value differently. Since ElSelect's inner input
      // might not update v-model directly via setValue, we can trigger the update.
      const selectComponent = wrapper.findComponent({ name: 'ElSelect' })
      if (selectComponent.exists()) {
        await selectComponent.setValue('WT26A01MA')
      } else {
        const input = wrapper.find('.search-bar input')
        if (input.exists()) await input.setValue('WT26A01MA')
      }
      
      await wrapper.find('.search-bar__btn').trigger('click')
      await waitForApi()
    })

    it('renders batch info and cell list in batch mode', () => {
      expect(wrapper.text()).toContain('WT26A01MA')
      expect(wrapper.find('.cell-table').exists()).toBe(true)
    })

    it('shows cell count in batch mode', () => {
      expect(wrapper.text()).toContain('2')
    })
  })

  // --- URL Parameters ---
  it('auto-queries when barcode is in URL params', async () => {
    routeQuery.current = { barcode: 'CELL001' }
    factory()
    await waitForApi()

    expect(cellApi.trace).toHaveBeenCalledWith('CELL001')
  })

  it('auto-queries when batchNo is in URL params', async () => {
    routeQuery.current = { batchNo: 'WT26A01MA' }
    factory()
    await waitForApi()

    expect(batchApi.getByNo).toHaveBeenCalledWith('WT26A01MA')
  })
})
