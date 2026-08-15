import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OcvParameterPage from './OcvParameterPage.vue'

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { realName: '测试员' } }),
}))

vi.mock('./ProcessFormPage.vue', () => ({
  default: defineComponent({
    name: 'ProcessFormPageStub',
    props: ['basePath', 'processName', 'draftFields', 'qualityFields', 'batchNo', 'showQualitySubmit'],
    template: '<div data-testid="process-form-stub" />',
  }),
}))

describe('OcvParameterPage', () => {
  it.each([
    ['ocv1', 'OCV1测试', 'processes/ocv1'],
    ['ocv2', 'OCV2测试', 'processes/ocv2'],
  ] as const)('configures %s as a parameter editor', (mode, processName, basePath) => {
    const wrapper = mount(OcvParameterPage, { props: { mode, batchNo: 'B1' } })
    const form = wrapper.findComponent({ name: 'ProcessFormPageStub' })

    expect(form.props('basePath')).toBe(basePath)
    expect(form.props('processName')).toBe(`${processName} - 参数编辑`)
    expect(form.props('batchNo')).toBe('B1')
    expect(form.props('qualityFields')).toEqual([])
    expect(form.props('showQualitySubmit')).toBe(false)
    expect(form.props('draftFields').map((field: { key: string }) => field.key)).toEqual([
      'equipmentCode',
      'ocvVoltageRange',
      'irRange',
      'capacityRange',
      'operatorName',
    ])
  })
})
