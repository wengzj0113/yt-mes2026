import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import BatchDetailPage from './BatchDetailPage.vue'
import { statusLogApi } from '@/api/status-log'

vi.mock('../processes/Ocv1Page.vue', () => ({
  default: defineComponent({ template: '<div class="batch-ocv1-entry">OCV1 drawer</div>' }),
}))

vi.mock('../processes/Ocv2Page.vue', () => ({
  default: defineComponent({ template: '<div class="batch-ocv2-entry">OCV2 drawer</div>' }),
}))

vi.mock('../processes/DynamicProcessPage.vue', () => ({
  default: defineComponent({ template: '<div class="batch-formation-grading-entry">formation-grading drawer</div>' }),
}))

vi.mock('../processes/FormationGradingPage.vue', () => ({
  default: defineComponent({ template: '<div class="batch-formation-grading-entry">formation-grading drawer</div>' }),
}))

vi.mock('@/api/batch', () => ({
  batchApi: {
    getByNo: vi.fn().mockResolvedValue({
      data: { batchNo: 'WT26A01MA', productModel: 'M1', productSpec: 'S1', plannedQty: 1000, status: 2, isDraft: false },
      success: true, message: 'ok',
    }),
    getProcessStatus: vi.fn().mockResolvedValue({
      data: [
        { processKey: 'ocv1', processName: 'OCV1', route: 'ocv1', status: 'not_entered', isDraft: false, recordStatus: 0, updatedAt: null },
        { processKey: 'ocv2', processName: 'OCV2', route: 'ocv2', status: 'not_entered', isDraft: false, recordStatus: 0, updatedAt: null },
        { processKey: 'formation-grading', processName: 'formation-grading', route: 'formation-grading', status: 'not_entered', isDraft: false, recordStatus: 0, updatedAt: null },
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

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ params: { batchNo: 'WT26A01MA' } }),
  }
})

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

  it('opens OCV1 and OCV2 from process cards in the shared right drawer', async () => {
    const wrapper = factory()
    await flushPromises()

    const ocv1Card = wrapper.findAll('.proc-card').find(card => card.text().includes('OCV1'))
    const ocv2Card = wrapper.findAll('.proc-card').find(card => card.text().includes('OCV2'))
    expect(ocv1Card).toBeDefined()
    expect(ocv2Card).toBeDefined()

    await ocv1Card!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.batch-ocv1-entry').exists()).toBe(true)

    await wrapper.find('.el-drawer__close-btn').trigger('click')
    await flushPromises()
    await ocv2Card!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.batch-ocv2-entry').exists()).toBe(true)
  })

  it('opens the combined formation-grading process from the batch detail page', async () => {
    const wrapper = factory()
    await flushPromises()

    const card = wrapper.findAll('.proc-card').find(item => item.text().includes('formation-grading'))
    expect(card).toBeDefined()

    await card!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.batch-formation-grading-entry').exists()).toBe(true)
  })

  it('renders batch status logs', async () => {
    const wrapper = factory()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(statusLogApi.list).toHaveBeenCalledWith('WT26A01MA')
    expect(wrapper.text()).toContain('开始生产')
  })
})
