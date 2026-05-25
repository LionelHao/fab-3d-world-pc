/**
 * Login (PC) — OAuth 区块单测（user-auth P5）
 *
 * 行为契约：
 *   - 渲染 OAuth divider + provider 按钮组（按 locale 选 provider 集）
 *   - en-US：Google / GitHub / Apple 三按钮
 *   - zh-CN：Google / GitHub / Apple 三按钮（PC 桌面 provider，per impl §0.3 line 58）
 *   - 点 provider 按钮 → 调 oauthAuthorize(provider, {redirectUri}) → window.location 跳转
 *   - oauthAuthorize 失败 → 错误 toast，window.location 不动
 *
 * 注：原 Login 业务（登录 / 注册 toast）已经有 E2E 覆盖，本文件只覆盖 P5 OAuth 区块增量。
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const oauthAuthorizeMock = vi.fn()
const loginByPasswordMock = vi.fn()
const getUserInfoMock = vi.fn()

vi.mock('@/service/auth', () => ({
  oauthAuthorize: (...a) => oauthAuthorizeMock(...a),
  loginByPassword: (...a) => loginByPasswordMock(...a),
}))

vi.mock('@/service/user', () => ({
  getUserInfo: (...a) => getUserInfoMock(...a),
}))

const routerPushMock = vi.fn(() => Promise.resolve())
vi.mock('vue-router', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useRouter: () => ({
      push: routerPushMock,
      currentRoute: { value: { fullPath: '/login', query: {} } },
    }),
  }
})

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

async function loadMessages(locale) {
  const auth = (await import(`@/locales/${locale}/auth.json`)).default
  const common = (await import(`@/locales/${locale}/common.json`)).default
  const login = (await import(`@/locales/${locale}/login.json`)).default
  return { auth, common, login }
}

async function mountLogin(locale = 'en-US') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: locale,
    messages: { [locale]: await loadMessages(locale) },
  })
  const Login = (await import('@/views/Login.vue')).default
  return mount(Login, { global: { plugins: [i18n] } })
}

describe('Login (PC) — OAuth 区块 (P5)', () => {
  const originalLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    oauthAuthorizeMock.mockReset()
    routerPushMock.mockReset()
    // 替换 window.location 以拦截赋值
    delete window.location
    window.location = { href: '', assign: vi.fn(), replace: vi.fn() }
  })

  afterAll(() => {
    window.location = originalLocation
  })

  it('渲染 OAuth provider 按钮（en-US: google/github/apple）', async () => {
    const wrapper = await mountLogin('en-US')
    await flushPromises()
    const buttons = wrapper.findAll('[data-test^="oauth-btn-"]')
    const ids = buttons.map((b) => b.attributes('data-test'))
    expect(ids).toContain('oauth-btn-google')
    expect(ids).toContain('oauth-btn-github')
    expect(ids).toContain('oauth-btn-apple')
    // PC 桌面端不出微信公众号按钮
    expect(ids).not.toContain('oauth-btn-wechat-mp')
  })

  it('渲染 OAuth provider 按钮（zh-CN 同样三桌面 provider）', async () => {
    const wrapper = await mountLogin('zh-CN')
    await flushPromises()
    const buttons = wrapper.findAll('[data-test^="oauth-btn-"]')
    const ids = buttons.map((b) => b.attributes('data-test'))
    expect(ids).toContain('oauth-btn-google')
    expect(ids).toContain('oauth-btn-github')
    expect(ids).toContain('oauth-btn-apple')
    expect(ids).not.toContain('oauth-btn-wechat-mp')
  })

  it('点 Google 按钮 → 调 oauthAuthorize("google", {redirectUri}) → 跳 authorizeUrl', async () => {
    oauthAuthorizeMock.mockResolvedValueOnce({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      state: 'st-1',
    })
    const wrapper = await mountLogin('en-US')
    await flushPromises()
    await wrapper.find('[data-test="oauth-btn-google"]').trigger('click')
    await flushPromises()
    expect(oauthAuthorizeMock).toHaveBeenCalledWith('google', expect.objectContaining({
      redirectUri: expect.stringContaining('/oauth/callback/google'),
    }))
    expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?...')
  })

  it('oauthAuthorize reject → 不跳转 + 错误 toast', async () => {
    oauthAuthorizeMock.mockRejectedValueOnce({ code: 500, message: 'boom' })
    const wrapper = await mountLogin('en-US')
    await flushPromises()
    await wrapper.find('[data-test="oauth-btn-github"]').trigger('click')
    await flushPromises()
    expect(window.location.href).toBe('')
  })

  it('OAuth 按钮显示 divider 文案', async () => {
    const wrapper = await mountLogin('en-US')
    await flushPromises()
    expect(wrapper.html()).toContain('Or sign in with')
  })
})
