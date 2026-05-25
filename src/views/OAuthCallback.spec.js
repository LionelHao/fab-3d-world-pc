/**
 * OAuthCallback (PC) — view 单测（user-auth P5）
 *
 * 行为契约：
 *   mount 时：
 *     1. 读 route.params.provider + route.query.{code, state, action?}
 *     2. action='bind'（已登录）→ 调 oauthBind → ElMessage.success + push /settings/security
 *     3. action 缺省（登录态）→ 调 oauthCallback → push /home（axios 拦截器已写 store）
 *     4. 缺 code 或 state → ElMessage.error stateMismatch + push /login
 *     5. callback 拒绝 → ElMessage.error 通用 + push /login?oauth_error=...
 *     6. bind 失败 422 (10301) → ElMessage.error bindingConflict + push /settings/security
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const oauthCallbackMock = vi.fn()
const oauthBindMock = vi.fn()

vi.mock('@/service/auth', () => ({
  oauthCallback: (...a) => oauthCallbackMock(...a),
  oauthBind: (...a) => oauthBindMock(...a),
}))

const routerPushMock = vi.fn(() => Promise.resolve())
const routerReplaceMock = vi.fn(() => Promise.resolve())
const routeRefMock = {
  value: {
    params: { provider: 'google' },
    query: { code: 'c', state: 's' },
  },
}
vi.mock('vue-router', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useRouter: () => ({
      push: routerPushMock,
      replace: routerReplaceMock,
      currentRoute: { value: { fullPath: '/oauth/callback/google' } },
    }),
    useRoute: () => routeRefMock.value,
  }
})

const elMessageSuccess = vi.fn()
const elMessageError = vi.fn()
const elMessageWarning = vi.fn()
vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: {
      success: elMessageSuccess,
      error: elMessageError,
      warning: elMessageWarning,
      info: vi.fn(),
    },
  }
})

async function loadMessages() {
  const auth = (await import('@/locales/en-US/auth.json')).default
  const common = (await import('@/locales/en-US/common.json')).default
  return { auth, common }
}

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: { 'en-US': await loadMessages() },
})

async function importView() {
  return (await import('@/views/OAuthCallback.vue')).default
}

describe('OAuthCallback (PC, P5)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    oauthCallbackMock.mockReset()
    oauthBindMock.mockReset()
    routerPushMock.mockReset()
    routerReplaceMock.mockReset()
    elMessageSuccess.mockReset()
    elMessageError.mockReset()
    elMessageWarning.mockReset()
    routeRefMock.value = {
      params: { provider: 'google' },
      query: { code: 'c', state: 's' },
    }
  })

  it('action 缺省 → 调 oauthCallback → push /home', async () => {
    oauthCallbackMock.mockResolvedValueOnce({
      token: 't', expireAt: Date.now() + 3600_000, user: { userId: 1 },
    })
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(oauthCallbackMock).toHaveBeenCalledWith('google', {
      code: 'c', state: 's', deviceType: 'pc',
    })
    expect(routerReplaceMock).toHaveBeenCalledWith('/home')
  })

  it('action=bind → 调 oauthBind → push /settings/security', async () => {
    routeRefMock.value = {
      params: { provider: 'github' },
      query: { code: 'cc', state: 'ss', action: 'bind' },
    }
    oauthBindMock.mockResolvedValueOnce(null)
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(oauthBindMock).toHaveBeenCalledWith('github', { code: 'cc', state: 'ss' })
    expect(elMessageSuccess).toHaveBeenCalled()
    expect(routerReplaceMock).toHaveBeenCalledWith('/settings/security')
  })

  it('缺 code → 不调 service，跳 /login + 错误 toast', async () => {
    routeRefMock.value = { params: { provider: 'google' }, query: { state: 's' } }
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(oauthCallbackMock).not.toHaveBeenCalled()
    expect(elMessageError).toHaveBeenCalled()
    expect(routerReplaceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/login' }),
    )
  })

  it('callback 拒绝（业务错误）→ push /login?oauth_error', async () => {
    oauthCallbackMock.mockRejectedValueOnce({ code: 10301, message: 'conflict' })
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(routerReplaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/login',
        query: expect.objectContaining({ oauth_error: expect.any(String) }),
      }),
    )
  })

  it('bind 失败 10301 → 错误 toast bindingConflict + 跳 /settings/security', async () => {
    routeRefMock.value = {
      params: { provider: 'github' },
      query: { code: 'c', state: 's', action: 'bind' },
    }
    oauthBindMock.mockRejectedValueOnce({ code: 10301, message: 'conflict' })
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(elMessageError).toHaveBeenCalled()
    expect(routerReplaceMock).toHaveBeenCalledWith('/settings/security')
  })

  it('缺 provider → 跳 /login', async () => {
    routeRefMock.value = { params: {}, query: { code: 'c', state: 's' } }
    const View = await importView()
    mount(View, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(oauthCallbackMock).not.toHaveBeenCalled()
    expect(routerReplaceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/login' }),
    )
  })
})
