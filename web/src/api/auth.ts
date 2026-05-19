import { post } from './index'
import type { LoginDto, LoginResult } from '@/types/api'

export const loginApi = {
  login(dto: LoginDto) {
    return post<LoginResult>('/auth/login', dto)
  },
}
