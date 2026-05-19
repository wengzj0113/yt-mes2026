import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BatchDetailPage from './BatchDetailPage.vue'
import { statusLogApi } from '@/api/status-log'

vi.mock('@/api/batch', () => ({
  batchApi: {
    getByNo: vi.fn().mockResolvedValue({
      data: { batchNo: 'WT26A01MA', productModel: 'M1', productSpec: 'S1', plannedQty: 1000, status: 2, isDraft: false },
      success: true, message: 'ok',
    }),
    getProcessStatus: vi.fn().mockResolvedValue({
      data: [
        { processKey: 'batching', processName: '配料', route: 'batching', status: 'submitted', isDraft: false, recordStatus: 1, updatedAt: null },
        { processKey: 'coating', processName: '涂布', route: 'coating', status: 'draft', isDraft: true, recordStatus: 1, updatedAt: null },
      ],
      success: true, message: 'ok',
    }),
  },
}))

vi.mock('@/api/cells', () => ({
  cellApi: {
    findByBatch: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  },
}))

vi.mock('@/api/status-log', () => ({
  statusLogApi: {
    list: vi.fn().mockResolvedValue({
      data: [{ fromStatus: 1, toStatus: 2, changeReason: '开始生产', createdAt: '2026-05-01T08:30:00Z' }],
      success: true,
      message: 'ok',
    }),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { batchNo: 'WT26A01MA' } }),
}))

function factory() {
  setActivePinia(createPinia())
  return mount(BatchDetailPage, { global: { stubs: ['el-icon'] } })
}

describe('BatchDetailPage', () => {
  it('renders batch info', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('WT26A01MA')
  })

  it('shows process navigation', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('配料')
  })

  it('renders batch status logs', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(statusLogApi.list).toHaveBeenCalledWith('WT26A01MA')
    expect(wrapper.text()).toContain('开始生产')
  })
})
