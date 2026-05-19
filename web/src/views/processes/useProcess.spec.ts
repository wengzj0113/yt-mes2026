import { describe, it, expect } from 'vitest'
import { useProcessApi, useProcessForm } from './useProcess'

describe('useProcessApi', () => {
  it('returns api functions', () => {
    const api = useProcessApi('batching')
    expect(api.getRecord).toBeDefined()
    expect(api.createDraft).toBeDefined()
    expect(api.submitQuality).toBeDefined()
  })
})

describe('useProcessForm', () => {
  it('initializes form state', () => {
    const form = useProcessForm(
      'batching',
      [{ key: 'operatorName', label: '操作员' }],
      [{ key: 'mixTime', label: '搅拌时间' }],
    )
    expect(form.draftForm.operatorName).toBe('')
    expect(form.qualityForm.mixTime).toBe('')
  })
})
