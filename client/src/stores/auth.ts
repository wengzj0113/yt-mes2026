import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: number
  username: string
  realName: string
  roleCode: number
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user') || 'null'),
  )

  const isLoggedIn = computed(() => !!token.value)
  const roleCode = computed(() => user.value?.roleCode ?? 0)
  const roleLabel = computed(() => {
    const map: Record<number, string> = {
      1: '操作员',
      2: '品质',
      3: '仓管',
      4: '管理员',
    }
    return map[roleCode.value] || '未知'
  })

  function setAuth(data: {
    accessToken: string
    refreshToken: string
    user: UserInfo
  }) {
    token.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = data.user
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function clearAuth() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return { token, refreshToken, user, isLoggedIn, roleCode, roleLabel, setAuth, clearAuth }
})
