import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import BatchingPage from './BatchingPage.vue'

const captureProps = vi.fn()

vi.mock('./ProcessFormPage.vue', () => ({
  default: defineComponent({
    name: 'ProcessFormPage',
    props: ['basePath', 'processName', 'draftFields', 'qualityFields'],
    setup(props) {
      captureProps(props)
      return () => h('div', 'mock-process-form')
    },
  }),
}))

vi.mock('@/api/master-data', () => ({
  masterDataApi: {
    operators: vi.fn().mockResolvedValue({
      data: [{ id: 1, realName: '张三' }],
      success: true,
      message: 'ok',
    }),
    equipment: vi.fn(),
    departments: vi.fn(),
  },
}))

vi.mock('@/api/material', () => ({
  materialApi: {
    getAvailable: vi.fn().mockResolvedValue({
      data: [{ supplierBatchNo: 'MAT-001' }],
      success: true,
      message: 'ok',
    }),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      batchNo: 'WT26A01MA',
    },
  }),
}))

describe('BatchingPage', () => {
  beforeEach(() => {
    captureProps.mockClear()
  })

  it('passes select-based draft fields to ProcessFormPage', async () => {
    mount(BatchingPage)
    await flushPromises()

    const lastCall = captureProps.mock.calls.at(-1)?.[0]
    expect(lastCall).toBeTruthy()
    expect(lastCall.draftFields.some((field: any) => field.key === 'operatorName' && field.type === 'select')).toBe(true)
    expect(lastCall.draftFields.some((field: any) => field.key === 'positiveMaterial' && field.type === 'select')).toBe(true)
  })
})
