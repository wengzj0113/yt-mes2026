import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

let isRefreshing = false
let refreshEpoch = 0
let pendingRequests: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

http.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  ;(config as any)._refreshEpoch = refreshEpoch
  return config
})

async function attemptRefresh(
  currentRefreshToken: string,
  retries = 1,
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post('/api/auth/refresh', {
        refreshToken: currentRefreshToken,
      })
      return res.data.data.accessToken
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('refresh failed')
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
      router.push('/login')
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

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
