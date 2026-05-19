import { get, post } from './index'
import type { UserDto } from '@/types/api'

export const userApi = {
  list() {
    return get<UserDto[]>('/users')
  },
  create(data: { username: string; realName: string; password: string; roleCode: number; phone?: string }) {
    return post<UserDto>('/users', data)
  },
  update(id: number, data: { realName?: string; roleCode?: number; phone?: string; isActive?: boolean }) {
    return post<UserDto>(`/users/${id}`, data)
  },
  delete(id: number) {
    return post(`/users/${id}/delete`)
  },
  resetPassword(id: number) {
    return post(`/users/${id}/reset-password`)
  },
}
