import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginPage from './LoginPage.vue'

vi.mock('@/api/auth', () => ({
  loginApi: {
    login: vi.fn().mockResolvedValue({ data: { accessToken: 'mock.token.payload', refreshToken: 'mock.refresh' }, success: true, message: 'ok' }),
  },
}))

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({}),
}))

function factory() {
  setActivePinia(createPinia())
  return mount(LoginPage, {
    global: { stubs: { 'el-input': false, 'el-button': false, 'el-form': false, 'el-form-item': false } },
  })
}

describe('LoginPage', () => {
  it('renders login form', () => {
    const wrapper = factory()
    expect(wrapper.text()).toContain('YT-MES')
  })
})
