import type { FormField } from './useProcess'

export function createStandardParameterFields(operatorName = ''): FormField[] {
  return [
    { key: 'equipmentCode', label: '设备编号', helpText: '工序设备编号' },
    {
      key: 'ocvVoltageRange',
      label: 'OCV电压范围',
      type: 'range',
      minKey: 'ocvVoltageMin',
      maxKey: 'ocvVoltageMax',
      unit: 'V',
      helpText: '开路电压筛选范围',
    },
    {
      key: 'irRange',
      label: '内阻范围',
      type: 'range',
      minKey: 'irMin',
      maxKey: 'irMax',
      unit: 'mΩ',
      helpText: '内阻筛选范围',
    },
    {
      key: 'capacityRange',
      label: '容量范围',
      type: 'range',
      minKey: 'capacityMin',
      maxKey: 'capacityMax',
      unit: 'mAh',
      helpText: '容量分级范围',
    },
    {
      key: 'operatorName',
      label: '操作员',
      defaultValue: operatorName,
      helpText: '负责本工序的操作员',
    },
  ]
}
