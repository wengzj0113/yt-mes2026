import { describe, expect, it } from 'vitest'
import { resolveTraceProcessStatus } from './processTraceStatus'

describe('resolveTraceProcessStatus', () => {
  it('shows saved instead of draft for a saved process record', () => {
    expect(resolveTraceProcessStatus({ isDraft: true, recordStatus: 1 })).toBe('saved')
  })

  it('keeps submitted and voided statuses distinct', () => {
    expect(resolveTraceProcessStatus({ isDraft: false, recordStatus: 1 })).toBe('submitted')
    expect(resolveTraceProcessStatus({ isDraft: true, recordStatus: 2 })).toBe('voided')
    expect(resolveTraceProcessStatus(null)).toBe('not_entered')
  })
})
