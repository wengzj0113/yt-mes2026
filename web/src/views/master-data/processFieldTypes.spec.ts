import { describe, expect, it } from 'vitest'
import { FIELD_TYPE_OPTIONS } from './processFieldTypes'

describe('process dictionary field types', () => {
  it('offers range fields for sorting-style parameters', () => {
    expect(FIELD_TYPE_OPTIONS).toEqual(expect.arrayContaining([
      { label: '文本', value: 'text' },
      { label: '数字', value: 'number' },
      { label: '下拉选择', value: 'select' },
      { label: '范围', value: 'range' },
    ]))
  })
})
