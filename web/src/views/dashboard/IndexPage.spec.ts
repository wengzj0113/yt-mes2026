import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import IndexPage from './IndexPage.vue'

vi.mock('@/api/batch', () => ({
  batchApi: {
    getStats: vi.fn().mockResolvedValue({
      data: {
        totalBatches: 10,
        inProgressBatches: 2,
        dailyPassRate: 96,
        abnormalCount: 0,
        integrity: 100,
      },
      success: true,
      message: 'ok',
    }),
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { batchNo: 'WT26A01MA', productModel: 'M1', productSpec: 'S1', plannedQty: 1000, status: 2, isDraft: false, createdAt: '2026-05-12T10:00:00' },
          { batchNo: 'WT26A02MB', productModel: 'M2', productSpec: 'S2', plannedQty: 500, status: 3, isDraft: false, createdAt: '2026-05-11T08:00:00' },
        ],
      },
      meta: { total: 10, page: 1, pageSize: 20 },
      success: true, message: 'ok',
    }),
  },
}))

vi.mock('@/api/system', () => ({
  systemApi: {
    logs: vi.fn().mockResolvedValue({
      data: { items: [] },
      success: true,
      message: 'ok',
    }),
  },
}))

vi.mock('@/api/quality', () => ({
  qualityApi: {
    getTrends: vi.fn().mockResolvedValue({
      data: [],
      success: true,
      message: 'ok',
    }),
  },
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  }
})

function factory() {
  setActivePinia(createPinia())
  return mount(IndexPage, { global: { stubs: ['el-icon'] } })
}

describe('Dashboard IndexPage', () => {
  it('renders stats cards', () => {
    const wrapper = factory()
    expect(wrapper.text()).toContain('累计生产批次')
    expect(wrapper.text()).toContain('当前在线批次')
  })

  it('loads and displays batch stats', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('10')
  })

  it('shows recent batches with navigation links', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('WT26A01MA')
    expect(wrapper.text()).toContain('WT26A02MB')
  })
})
