import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let refreshEpoch = 0
let pendingRequests: Array<(token: string) => void> = []

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    (config as any)._refreshEpoch = refreshEpoch
    return config
  },
  (error) => Promise.reject(error),
)

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

request.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body.success === false) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return body
  },
  async (error) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      const authStore = useAuthStore()

      if (!authStore.refreshToken) {
        authStore.clearAuth()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
        return Promise.reject(error)
      }

      const originalRequest = error.config
      const reqEpoch = (originalRequest as any)._refreshEpoch ?? -1

      // A refresh already happened since this request was sent —
      // retry with the current token without refreshing again
      if (reqEpoch < refreshEpoch) {
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`
        return request(originalRequest)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(request(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const newToken = await attemptRefresh(authStore.refreshToken)

        authStore.token = newToken
        localStorage.setItem('token', newToken)
        refreshEpoch++

        pendingRequests.forEach((cb) => cb(newToken))
        pendingRequests = []

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return request(originalRequest)
      } catch {
        pendingRequests = []
        isRefreshing = false
        authStore.clearAuth()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 403) {
      ElMessage.error('权限不足')
    } else if (status === 422 && data?.error?.fields) {
      const msgs = data.error.fields.map((f: any) => f.message).join('; ')
      ElMessage.warning(msgs || data.message)
    } else {
      ElMessage.error(data?.message || '网络异常')
    }
    return Promise.reject(error)
  },
)

export default request
