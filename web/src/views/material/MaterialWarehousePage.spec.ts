import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MaterialWarehousePage from './MaterialWarehousePage.vue'

vi.mock('@/api/material', () => ({
  materialApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 1, batchNo: 'WT26A01MA', materialType: 1, supplierBatchNo: 'SUP-001', quantity: 100, unit: 'kg', createdAt: '2026-01-01' },
        { id: 2, batchNo: 'WT26A01MA', materialType: 3, supplierBatchNo: 'SUP-002', quantity: 50, unit: 'kg', createdAt: '2026-01-02' },
      ],
      success: true,
      message: 'ok',
    }),
    create: vi.fn().mockResolvedValue({
      data: { id: 3, batchNo: 'WT26A01MA', materialType: 2, supplierBatchNo: 'SUP-003', quantity: 200, unit: 'kg', createdAt: '2026-01-03' },
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
  return mount(MaterialWarehousePage, { global: { stubs: ['el-icon'] } })
}

describe('MaterialWarehousePage', () => {
  it('renders material table with type names', async () => {
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('SUP-001')
    expect(wrapper.text()).toContain('正极')
    expect(wrapper.text()).toContain('SUP-002')
    expect(wrapper.text()).toContain('电解液')
  })

  it('opens create dialog on button click', async () => {
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('添加材料'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('材料类型')
    expect(wrapper.text()).toContain('供应商批次号')
  })
})
