import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProcessHubPage from './ProcessHubPage.vue'

const mocks = vi.hoisted(() => ({
  getByNo: vi.fn(),
  getProcessStatus: vi.fn(),
  list: vi.fn(),
}))

vi.mock('@/api/batch', () => ({ batchApi: { getByNo: mocks.getByNo, getProcessStatus: mocks.getProcessStatus } }))
vi.mock('@/api/process-dictionary', () => ({ processDictionaryApi: { list: mocks.list } }))
vi.mock('./Ocv1Page.vue', () => ({ default: defineComponent({ template: '<div class="ocv1-entry">OCV1 entry</div>' }) }))
vi.mock('./Ocv2Page.vue', () => ({ default: defineComponent({ template: '<div class="ocv2-entry">OCV2 entry</div>' }) }))

describe('ProcessHubPage OCV entries', () => {
  it('opens OCV1 and OCV2 entry components from active process cards', async () => {
    mocks.list.mockResolvedValue({ data: { items: [
      { processCode: 'ocv1', processName: 'OCV1测试', sortOrder: 150, isActive: true },
      { processCode: 'ocv2', processName: 'OCV2测试', sortOrder: 155, isActive: true },
    ] } })
    mocks.getByNo.mockResolvedValue({ data: { batchNo: 'BATCH-001', productModel: 'M1', plannedQty: 1 } })
    mocks.getProcessStatus.mockResolvedValue({ data: [] })

    const wrapper = mount(ProcessHubPage, { global: { stubs: { 'el-icon': true } } })
    await wrapper.find('input').setValue('BATCH-001')
    await wrapper.find('input').trigger('keyup.enter')
    await flushPromises()

    const cards = wrapper.findAll('.process-card')
    await cards[0].trigger('click')
    await flushPromises()
    expect(wrapper.find('.ocv1-entry').exists()).toBe(true)

    const closeButton = wrapper.find('.el-drawer__close-btn')
    if (closeButton.exists()) {
      await closeButton.trigger('click')
      await flushPromises()
    }
    await cards[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.ocv2-entry').exists()).toBe(true)
  })
})
