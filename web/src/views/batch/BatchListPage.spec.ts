import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BatchListPage from './BatchListPage.vue'
import { batchApi } from '@/api/batch'
import { masterDataApi } from '@/api/master-data'

vi.mock('@/api/batch', () => ({
  batchApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { id: 1, batchNo: 'WT26A01MA', productModel: 'M1', productSpec: 'S1', plannedQty: 1000, status: 4, isDraft: false, createdAt: '2026-01-01' },
        ],
        total: 1,
      },
      success: true,
      message: 'ok',
    }),
    create: vi.fn().mockResolvedValue({ data: { batchNo: 'NEW001' }, success: true, message: 'ok' }),
    update: vi.fn().mockResolvedValue({ data: {}, success: true, message: 'ok' }),
    generateNo: vi.fn().mockResolvedValue({ data: { batchNo: 'WT26A01MA' }, success: true, message: 'ok' }),
  },
}))

vi.mock('@/api/master-data', () => ({
  masterDataApi: {
    departments: vi.fn().mockResolvedValue({
      data: [{ code: 'PROD', name: '生产部', isActive: true }],
      success: true,
      message: 'ok',
    }),
    operators: vi.fn(),
    equipment: vi.fn(),
  },
}))

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({}),
}))

function factory() {
  setActivePinia(createPinia())
  return mount(BatchListPage, { global: { stubs: ['el-icon'] } })
}

describe('BatchListPage', () => {
  it('renders batch table', async () => {
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('WT26A01MA')
  })

  it('uses 生产班组 wording in create form', async () => {
    const wrapper = factory()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('生产班组')
  })

  it('fills batch number from generate api', async () => {
    const wrapper = factory()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    const generateButton = wrapper.findAll('button').find((item) => item.text().includes('生成批次号'))
    expect(generateButton).toBeTruthy()

    await generateButton!.trigger('click')
    await flushPromises()

    const batchNoInput = wrapper.find('.batch-no-row input')
    expect((batchNoInput.element as HTMLInputElement).value).toBe('WT26A01MA')
  })

  it('loads department master data for workshop selection', async () => {
    const wrapper = factory()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(masterDataApi.departments).toHaveBeenCalled()
    expect((wrapper.vm as any).workshopOptions).toHaveLength(1)
    expect((wrapper.vm as any).workshopOptions[0].label).toBe((wrapper.vm as any).workshopOptions[0].value)
  })

  it('shows a restore action for closed batches', async () => {
    const wrapper = factory()
    await flushPromises()

    expect(wrapper.text()).toContain('恢复批次')
  })

  it('restores a closed batch to in progress', async () => {
    const wrapper = factory()
    await flushPromises()

    await (wrapper.vm as any).handleRestore({ batchNo: 'WT26A01MA', status: 4 })

    expect(batchApi.update).toHaveBeenCalledWith('WT26A01MA', { status: 2 })
  })
})
