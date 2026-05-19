import { get, post } from './index'
import type { DepartmentDto } from '@/types/api'

export const departmentApi = {
  list() {
    return get<DepartmentDto[]>('/departments')
  },
  create(data: { name: string; code: string }) {
    return post<DepartmentDto>('/departments', data)
  },
  update(id: number, data: { name?: string; code?: string; isActive?: boolean }) {
    return post<DepartmentDto>(`/departments/${id}`, data)
  },
  delete(id: number) {
    return post(`/departments/${id}/delete`)
  },
}
