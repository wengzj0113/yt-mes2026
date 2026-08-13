import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { useAuthStore } from '@/stores/auth'
import { getMockResponse } from './mock'

// Module-level refresh state (must be declared before interceptors that reference them)
let isRefreshing = false
let refreshEpoch = 0
let pendingRequests: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Vercel/Zeabur 预览环境或无后端环境开启 Mock
const isPreview = (import.meta as any).env?.MODE === 'test' ||
                 (import.meta as any).env?.VITEST === true ||
                 window.location.hostname.includes('vercel.app') ||
                 window.location.hostname.includes('zeabur.app')

http.interceptors.request.use((config) => {
  // Mock 拦截逻辑
  if (isPreview) {
    const mockRes = getMockResponse(config)
    if (mockRes) {
      console.log(`[Mock API] ${config.method?.toUpperCase()} ${config.url}`, mockRes)
      config.adapter = async () => ({
        data: mockRes,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      })
    }
  }

  // 公开接口不添加 Authorization header
  const url = config.url || ''
  const isPublicUrl = url.includes('/auth/login') ||
                      url.includes('/users/register') ||
                      url.includes('/auth/refresh')
  if (!isPublicUrl) {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
  }
  ;(config as any)._refreshEpoch = refreshEpoch
  return config
})

async function attemptRefresh(refreshToken: string): Promise<string> {
  try {
    const res = await axios.post('/api/auth/refresh', {
      refreshToken,
    })
    return res.data.data.accessToken
  } catch (err) {
    // Refresh token 401 is unrecoverable, no retry needed
    throw err
  }
}

http.interceptors.response.use(
  (res) => {
    const body = res.data as ApiResponse
    if (body.success === false) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return res
  },
  async (err) => {
    // 如果是登录/注册等公开接口，直接返回，不进入过期跳转逻辑
    if (err.config?.url?.includes('/auth/login') || 
        err.config?.url?.includes('/users/register') ||
        err.config?.url?.includes('/auth/refresh')) {
      const msg = err.response?.data?.message || err.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(err)
    }

    if (err.response?.status !== 401) {
      // Log full validation errors for debugging
      if (err.response?.data?.error?.fields) {
        console.error('[API Error Details]', err.response.data.error)
      }
      const msg = err.response?.data?.message || err.message || '网络异常'
      ElMessage.error(msg)
      return Promise.reject(err)
    }

    const authStore = useAuthStore()

    if (!authStore.refreshToken) {
      authStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      const { default: router } = await import('@/router')
      router.push('/login')
      return Promise.reject(err)
    }

    const originalRequest = err.config
    const reqEpoch = (originalRequest as any)._refreshEpoch ?? -1

    if (reqEpoch < refreshEpoch) {
      originalRequest.headers.Authorization = `Bearer ${authStore.token}`
      return http(originalRequest)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(http(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await attemptRefresh(authStore.refreshToken)

      authStore.token = newToken
      localStorage.setItem('token', newToken)
      refreshEpoch++

      pendingRequests.forEach(({ resolve }) => resolve(newToken))
      pendingRequests = []

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return http(originalRequest)
    } catch {
      const refreshErr = err
      pendingRequests.forEach(({ reject }) => reject(refreshErr))
      pendingRequests = []
      isRefreshing = false
      authStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      const { default: router } = await import('@/router')
      router.push('/login')
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

// Exposed for auth store to cancel pending 401 refresh requests on manual logout
export function cancelPendingRequests(reason = '用户已登出') {
  pendingRequests.forEach(({ reject }) => reject(new Error(reason)))
  pendingRequests = []
}

export async function post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  const res = await http.post<ApiResponse<T>>(url, data)
  return res.data
}

export async function get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
  const res = await http.get<ApiResponse<T>>(url, { params })
  return res.data
}

export async function put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  const res = await http.put<ApiResponse<T>>(url, data)
  return res.data
}

export async function patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  const res = await http.patch<ApiResponse<T>>(url, data)
  return res.data
}

export async function del<T = any>(url: string): Promise<ApiResponse<T>> {
  const res = await http.delete<ApiResponse<T>>(url)
  return res.data
}

export async function httpDelete<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
  const res = await http.delete<ApiResponse<T>>(url, { params })
  return res.data
}

export default http
