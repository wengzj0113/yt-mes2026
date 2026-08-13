import { describe, expect, it } from 'vitest'
import { formatKValue } from './formatKValue'

describe('formatKValue', () => {
  it('shows a dash when OCV1 or OCV2 data is incomplete', () => {
    expect(formatKValue(null)).toBe('-')
    expect(formatKValue(undefined)).toBe('-')
  })

  it('formats the calculated K value to four decimals', () => {
    expect(formatKValue(12.3456)).toBe('12.3456')
  })
})
