import { get, post } from './index'
import type { LogDto, SystemConfigDto } from '@/types/api'

export const systemApi = {
  logs(params?: { page?: number; pageSize?: number; module?: string }) {
    return get<{ items: LogDto[]; meta?: { total: number } }>('/system/logs', params)
  },
  configs() {
    return get<SystemConfigDto[]>('/system/configs')
  },
  updateConfig(id: number, value: string) {
    return post(`/system/configs/${id}`, { value })
  },
  roles() {
    return get<Array<{ code: number; name: string }>>('/system/roles')
  },
}
