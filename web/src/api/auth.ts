import { post } from './index'
import type { LoginDto, LoginResult } from '@/types/api'

export const loginApi = {
  login(dto: LoginDto) {
    return post<LoginResult>('/auth/login', dto)
  },
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  return post('/auth/change-password', data)
}
