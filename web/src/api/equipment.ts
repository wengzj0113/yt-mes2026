import { get, post } from './index'
import type { EquipmentDto } from '@/types/api'

export const equipmentApi = {
  list() {
    return get<EquipmentDto[]>('/equipment')
  },
  create(data: { equipmentCode: string; equipmentName: string; model?: string; departmentCode?: string }) {
    return post<EquipmentDto>('/equipment', data)
  },
  update(id: number, data: { equipmentName?: string; model?: string; departmentCode?: string; isActive?: boolean }) {
    return post<EquipmentDto>(`/equipment/${id}`, data)
  },
  delete(id: number) {
    return post(`/equipment/${id}/delete`)
  },
}
