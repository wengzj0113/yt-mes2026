import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QualityCheckPage from './QualityCheckPage.vue'

const { mockList, mockCreate } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('@/api/quality', () => ({
  qualityApi: {
    list: mockList,
    create: mockCreate,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { batchNo: 'WT26A01MA' } }),
}))

const mockChecks = [
  {
    id: 1,
    batchNo: 'WT26A01MA',
    processType: 3,
    inspectionResult: 1,
    defectQty: null,
    defectReason: null,
    inspectorName: '张三',
    abnormalRecord: null,
    createdAt: '2026-05-10T10:00:00',
  },
  {
    id: 2,
    batchNo: 'WT26A01MA',
    processType: 7,
    inspectionResult: 2,
    defectQty: 5,
    defectReason: '尺寸偏差',
    inspectorName: '李四',
    abnormalRecord: '需返工处理',
    createdAt: '2026-05-11T14:30:00',
  },
]

function factory() {
  setActivePinia(createPinia())
  return mount(QualityCheckPage, { global: { stubs: ['el-icon'] } })
}

describe('QualityCheckPage', () => {
  it('renders quality checks table', async () => {
    mockList.mockResolvedValueOnce({ data: mockChecks, success: true, message: 'ok' })
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('WT26A01MA')
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('李四')
    expect(wrapper.text()).toContain('尺寸偏差')
  })

  it('shows empty state when no checks exist', async () => {
    mockList.mockResolvedValueOnce({ data: [], success: true, message: 'ok' })
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('质量检验')
  })

  it('opens create dialog on button click', async () => {
    mockList.mockResolvedValueOnce({ data: mockChecks, success: true, message: 'ok' })
    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('.create-btn').trigger('click')
    expect(wrapper.text()).toContain('创建检验记录')
  })

  it('submits new quality check', async () => {
    mockList.mockResolvedValueOnce({ data: mockChecks, success: true, message: 'ok' })
    mockCreate.mockResolvedValueOnce({ data: { id: 3 }, success: true, message: '创建成功' })
    mockList.mockResolvedValueOnce({
      data: [
        ...mockChecks,
        { id: 3, batchNo: 'WT26A01MA', processType: 1, inspectionResult: 1, defectQty: null, defectReason: null, inspectorName: '王五', abnormalRecord: null, createdAt: '2026-05-12T09:00:00' },
      ],
      success: true,
      message: 'ok',
    })

    const wrapper = factory()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Open dialog
    await wrapper.find('.create-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // Set form values via exposed reactive state
    const vm = wrapper.vm as any
    vm.form.processType = 1
    vm.form.inspectionResult = 1
    vm.form.inspectorName = '王五'
    await wrapper.vm.$nextTick()

    // Clear form validation before submit
    vm.formRef?.clearValidate()
    await vm.handleSubmit()

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockCreate).toHaveBeenCalledWith('WT26A01MA', expect.objectContaining({
      processType: 1,
      inspectionResult: 1,
      inspectorName: '王五',
    }))

    expect(wrapper.text()).toContain('王五')
  })
})
