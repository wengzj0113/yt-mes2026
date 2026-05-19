import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    username: string
    realName: string
    roleCode: number
  }
}

export function loginApi(data: LoginParams) {
  return request.post<LoginResult>('/auth/login', data)
}

export function refreshTokenApi(refreshToken: string) {
  return request.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
}
