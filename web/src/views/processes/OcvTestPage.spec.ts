import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Ocv1Page from './Ocv1Page.vue'
import Ocv2Page from './Ocv2Page.vue'

const OcvParameterPageStub = defineComponent({
  props: ['mode', 'processName', 'batchNo'],
  emits: ['close'],
  template: '<div class="ocv-stub" :data-mode="mode" :data-name="processName" :data-batch="batchNo" />',
})

vi.mock('@/api/cells', () => ({
  cellApi: {
    uploadOcv1: vi.fn(),
    uploadOcv2: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { batchNo: 'BATCH-001' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

const stubs = {
  'el-card': defineComponent({ template: '<div><slot /></div>' }),
  'el-divider': defineComponent({ template: '<div><slot /></div>' }),
  OcvParameterPage: OcvParameterPageStub,
}

describe('OCV test entry pages', () => {
  it('Ocv1Page passes correct mode and props to OcvParameterPage', () => {
    const wrapper = mount(Ocv1Page, {
      props: { batchNo: 'BATCH-001' },
      global: { stubs },
    })
    const stub = wrapper.find('.ocv-stub')
    expect(stub.exists()).toBe(true)
    expect(stub.attributes('data-mode')).toBe('ocv1')
    expect(stub.attributes('data-name')).toBe('OCV1测试')
    expect(stub.attributes('data-batch')).toBe('BATCH-001')
  })

  it('Ocv2Page passes correct mode and props to OcvParameterPage', () => {
    const wrapper = mount(Ocv2Page, {
      props: { batchNo: 'BATCH-001' },
      global: { stubs },
    })
    const stub = wrapper.find('.ocv-stub')
    expect(stub.exists()).toBe(true)
    expect(stub.attributes('data-mode')).toBe('ocv2')
    expect(stub.attributes('data-name')).toBe('OCV2测试')
    expect(stub.attributes('data-batch')).toBe('BATCH-001')
  })
})
