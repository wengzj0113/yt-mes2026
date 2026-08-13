import { get } from './index'

export interface DepartmentOption {
  id: number
  code: string
  name: string
  isActive: boolean
}

export interface EquipmentOption {
  id: number
  equipmentCode: string
  equipmentName: string
  model?: string | null
  departmentCode?: string | null
  isActive: boolean
}

export interface OperatorOption {
  id: number
  realName: string
}

export const masterDataApi = {
  departments() {
    return get<DepartmentOption[]>('/departments')
  },
  equipment() {
    return get<EquipmentOption[]>('/equipment')
  },
  operators() {
    return get<OperatorOption[]>('/users/operators')
  },
  qualityPersonnel() {
    return get<OperatorOption[]>('/users/quality-personnel')
  },
}
