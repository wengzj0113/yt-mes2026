import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi } from '@/api/auth'
import { cancelPendingRequests, post } from '@/api/index'

interface AuthUser {
  sub: number
  username: string
  realName?: string
  roleCode?: number
}

function decodeToken(token: string): AuthUser | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    if (!payload || typeof payload.sub !== 'number' || typeof payload.username !== 'string') {
      return null
    }
    return {
      sub: payload.sub,
      username: payload.username,
      realName: payload.realName,
      roleCode: payload.roleCode,
    }
  } catch (e) {
    console.error('Failed to decode JWT token:', e)
    return null
  }
}

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw) as AuthUser
  } catch {
    // ignore
  }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? '')
  const refreshToken = ref(localStorage.getItem('refreshToken') ?? '')
  const user = ref<AuthUser | null>(loadUserFromStorage() || decodeToken(token.value))
  const isLoggedIn = computed(() => !!token.value)

  function persistUser(next: AuthUser | null) {
    user.value = next
    if (next) {
      localStorage.setItem('user', JSON.stringify(next))
    } else {
      localStorage.removeItem('user')
    }
  }

  async function login(username: string, password: string) {
    const res = await loginApi.login({ username, password })
    token.value = res.data.accessToken
    refreshToken.value = res.data.refreshToken
    localStorage.setItem('token', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)

    const payload = decodeToken(res.data.accessToken)
    if (payload) {
      persistUser(payload)
    }
  }

  async function logout() {
    // 通知后端（用于审计日志）
    try {
      await post('/auth/logout', {})
    } catch {
      // 即使后端请求失败也清理本地状态
    }
    // 取消所有 pending 的 401 刷新请求
    cancelPendingRequests('用户已登出')
    // 清理本地状态
    token.value = ''
    refreshToken.value = ''
    persistUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  return { token, refreshToken, user, isLoggedIn, login, logout, decodeToken }
})

// 权限便捷计算属性（在组件中通过 useAuthStore() 调用）
export function useAuthPermissions() {
  const store = useAuthStore()
  const isQualityStaff = computed(() => store.user?.roleCode === 2 || store.user?.roleCode === 4)
  const isAdmin = computed(() => store.user?.roleCode === 4)
  return { isQualityStaff, isAdmin }
}
