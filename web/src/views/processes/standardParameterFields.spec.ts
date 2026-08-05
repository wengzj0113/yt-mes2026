import { describe, expect, it } from 'vitest'
import { createStandardParameterFields } from './standardParameterFields'

describe('createStandardParameterFields', () => {
  it('returns the sorting-style OCV parameter fields and operator default', () => {
    const fields = createStandardParameterFields('张三')

    expect(fields.map((field) => field.key)).toEqual([
      'equipmentCode',
      'ocvVoltageRange',
      'irRange',
      'capacityRange',
      'operatorName',
    ])
    expect(fields[1]).toMatchObject({
      type: 'range',
      minKey: 'ocvVoltageMin',
      maxKey: 'ocvVoltageMax',
      unit: 'V',
    })
    expect(fields[2]).toMatchObject({
      type: 'range',
      minKey: 'irMin',
      maxKey: 'irMax',
      unit: 'mΩ',
    })
    expect(fields[3]).toMatchObject({
      type: 'range',
      minKey: 'capacityMin',
      maxKey: 'capacityMax',
      unit: 'mAh',
    })
    expect(fields[4]).toMatchObject({
      key: 'operatorName',
      defaultValue: '张三',
    })
  })
})
