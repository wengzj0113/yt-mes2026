import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? '')
  const refreshToken = ref(localStorage.getItem('refreshToken') ?? '')
  const user = ref<{ sub: number; username: string; roleCode?: number } | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  function decodeToken(token: string) {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error('Failed to decode JWT token:', e)
      return null
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
      user.value = { sub: payload.sub, username: payload.username, roleCode: payload.roleCode }
    }
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  return { token, refreshToken, user, isLoggedIn, login, logout }
})
