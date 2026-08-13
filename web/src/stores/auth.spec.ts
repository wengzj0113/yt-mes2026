import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

vi.mock('@/api/auth', () => ({
  loginApi: {
    login: vi.fn().mockResolvedValue({
      data: {
        accessToken: 'header.eyJzdWIiOjEsInVzZXJuYW1lIjoidGVzdCJ9.signature',
        refreshToken: 'refresh.header.signature',
        user: { id: 1, username: 'test', realName: 'Test', roleCode: 1 },
      },
      success: true,
      message: 'ok',
    }),
  },
}))

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts logged out', () => {
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('logs in and stores token', async () => {
    const store = useAuthStore()
    await store.login('test', '123456')
    expect(store.isLoggedIn).toBe(true)
    expect(localStorage.getItem('token')).toBeTruthy()
  })

  it('logout clears token', async () => {
    const store = useAuthStore()
    await store.login('test', '123456')
    await store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('stores refreshToken from login', async () => {
    const store = useAuthStore()
    await store.login('test', '123456')
    expect(store.refreshToken).toBeTruthy()
    expect(localStorage.getItem('refreshToken')).toBeTruthy()
  })

  it('logout clears refreshToken', async () => {
    const store = useAuthStore()
    await store.login('test', '123456')
    await store.logout()
    expect(store.refreshToken).toBe('')
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})
