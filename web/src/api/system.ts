import { get, post } from './index'
import type { LogDto, RoleDto, SystemConfigDto } from '@/types/api'

export const systemApi = {
  logs(params?: { page?: number; pageSize?: number; module?: string }) {
    return get<{ items: LogDto[] }>('/system/logs', params)
  },
  sorterLogs(params?: { page?: number; pageSize?: number; isSuccess?: boolean; apiEndpoint?: string; apiType?: string }) {
    return get<{ items: any[] }>('/system/sorter-logs', params)
  },
  configs() {
    return get<SystemConfigDto[]>('/system/configs')
  },
  updateConfig(id: number, value: string) {
    return post(`/system/configs/${id}`, { value })
  },
  roles() {
    return get<RoleDto[]>('/system/roles')
  },
  createRole(data: { code: number; name: string; description?: string }) {
    return post<RoleDto>('/system/roles', data)
  },
  updateRole(code: number, data: { name?: string; description?: string }) {
    return post<RoleDto>(`/system/roles/${code}`, data)
  },
  deleteRole(code: number) {
    return post(`/system/roles/${code}/delete`)
  },
}
