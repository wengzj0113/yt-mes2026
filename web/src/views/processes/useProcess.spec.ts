import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post } from '@/api'
import { useProcessApi, useProcessForm } from './useProcess'

vi.mock('@/api', () => ({
  get: vi.fn(() => Promise.resolve({ data: null })),
  post: vi.fn(() => Promise.resolve({ data: null })),
}))

describe('useProcessApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns api functions', () => {
    const api = useProcessApi('batching')
    expect(api.getRecord).toBeDefined()
    expect(api.createDraft).toBeDefined()
    expect(api.submitQuality).toBeDefined()
  })

  it('uses the dynamic submit endpoint for Excel-defined ordinary processes', async () => {
    const api = useProcessApi('process-dynamic/batching')
    await api.createDraft('BAT-397873', { operatorName: '系统管理员' })
    await api.submitQuality('BAT-397873', { operatorName: '系统管理员' })

    expect(post).toHaveBeenNthCalledWith(1, '/process-dynamic/batching/draft', {
      batchNo: 'BAT-397873', operatorName: '系统管理员',
    })
    expect(post).toHaveBeenNthCalledWith(2, '/process-dynamic/batching/submit', {
      batchNo: 'BAT-397873', operatorName: '系统管理员',
    })
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

  it('submits the complete draft payload for dynamic quality review', async () => {
    vi.clearAllMocks()
    const form = useProcessForm(
      'process-dynamic/formation-grading',
      [{ key: 'activationDuration', label: '活化时间', type: 'number' }, { key: 'operatorName', label: '操作员' }],
      [],
    )
    form.draftForm.activationDuration = 1
    form.draftForm.operatorName = '系统管理员'

    await form.submit('BAT-397873')

    expect(post).toHaveBeenNthCalledWith(2, '/process-dynamic/formation-grading/submit', {
      batchNo: 'BAT-397873', activationDuration: 1, operatorName: '系统管理员',
    })
  })
})
