import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn(), currentRoute: { value: { fullPath: '/' } } },
}))

vi.mock('@/i18n', () => ({
  t: (k) => k,
}))

/**
 * service/auth — PC 端认证域 service 单测 (user-auth P1)
 *
 * 验证：
 * - 13 接口 URL 与契约一致
 * - login = loginByPassword 别名
 * - oauth provider/params 拼接正确
 */
describe('service/auth — PC 认证域接口 (P1)', () => {
  let axios
  let mock
  let auth

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const axiosMod = await import('@/utils/axios')
    axios = axiosMod.default
    mock = new MockAdapter(axios)
    auth = await import('@/service/auth')
  })

  afterEach(() => {
    mock.restore()
  })

  it('sendSms 调 POST /auth/sms/send 带 target/scene', async () => {
    mock.onPost('/auth/sms/send').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ target: '13800', scene: 'login' })
      return [200, { code: 200, data: {} }]
    })
    await auth.sendSms('13800', 'login')
  })

  it('sendEmail 调 POST /auth/email/send', async () => {
    mock.onPost('/auth/email/send').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ target: 'a@b.com', scene: 'signup' })
      return [200, { code: 200, data: {} }]
    })
    await auth.sendEmail('a@b.com', 'signup')
  })

  it('loginByPassword 调 POST /auth/login/password', async () => {
    mock.onPost('/auth/login/password').reply(200, {
      code: 200,
      data: { token: 'tk', expireAt: Date.now() + 3600_000, user: { userId: 1 } },
    })
    const data = await auth.loginByPassword({ identifier: 'lionel', password: 'x' })
    expect(data.token).toBe('tk')
  })

  it('login 等于 loginByPassword 别名', () => {
    expect(auth.login).toBe(auth.loginByPassword)
  })

  it('loginByCode 调 POST /auth/login/code', async () => {
    mock.onPost('/auth/login/code').reply(200, {
      code: 200, data: { token: 'tk', expireAt: Date.now() + 3600_000, user: { userId: 1 } },
    })
    await auth.loginByCode({ identifier: '13800', code: '123456' })
  })

  it('register 调 POST /auth/signup', async () => {
    mock.onPost('/auth/signup').reply(200, {
      code: 200, data: { token: 'tk', expireAt: Date.now() + 3600_000, user: { userId: 1 } },
    })
    await auth.register({ identifier: '13800', password: 'p', code: '123456' })
  })

  it('logout 调 POST /auth/logout', async () => {
    mock.onPost('/auth/logout').reply(200, { code: 200, data: {} })
    await auth.logout()
  })

  it('refresh 调 POST /auth/refresh', async () => {
    mock.onPost('/auth/refresh').reply(200, { code: 200, data: { token: 'new', expireAt: Date.now() + 3600_000 } })
    const data = await auth.refresh()
    expect(data.token).toBe('new')
  })

  it('changePassword 调 POST /auth/password/change', async () => {
    mock.onPost('/auth/password/change').reply(200, { code: 200, data: {} })
    await auth.changePassword({ oldPassword: 'a', newPassword: 'b' })
  })

  it('requestPasswordReset 调 POST /auth/password/reset/request', async () => {
    mock.onPost('/auth/password/reset/request').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ target: 'a@b.com' })
      return [200, { code: 200, data: {} }]
    })
    await auth.requestPasswordReset('a@b.com')
  })

  it('confirmPasswordReset 调 POST /auth/password/reset/confirm', async () => {
    mock.onPost('/auth/password/reset/confirm').reply(200, { code: 200, data: {} })
    await auth.confirmPasswordReset({ target: 'a@b.com', code: '111', newPassword: 'x' })
  })

  it('listSessions 调 GET /auth/sessions', async () => {
    mock.onGet('/auth/sessions').reply(200, { code: 200, data: [] })
    await auth.listSessions()
  })

  it('revokeSession 调 POST /auth/sessions/{tokenValue}/revoke', async () => {
    mock.onPost('/auth/sessions/abc/revoke').reply(200, { code: 200, data: {} })
    await auth.revokeSession('abc')
  })

  it('revokeOtherSessions 调 POST /auth/sessions/revoke-others', async () => {
    mock.onPost('/auth/sessions/revoke-others').reply(200, { code: 200, data: {} })
    await auth.revokeOtherSessions()
  })

  it('oauthAuthorize 调 GET /auth/oauth/{provider}/authorize 带 params', async () => {
    mock.onGet('/auth/oauth/google/authorize').reply((config) => {
      expect(config.params).toEqual({ redirect: 'http://x' })
      return [200, { code: 200, data: { authorizeUrl: 'https://...' } }]
    })
    await auth.oauthAuthorize('google', { redirect: 'http://x' })
  })

  it('oauthCallback 调 POST /auth/oauth/{provider}/callback', async () => {
    mock.onPost('/auth/oauth/apple/callback').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ code: 'xyz', state: 's' })
      return [200, { code: 200, data: { token: 't', expireAt: Date.now() + 3600_000, user: { userId: 1 } } }]
    })
    await auth.oauthCallback('apple', { code: 'xyz', state: 's' })
  })

  it('oauthBind 调 POST /auth/oauth/{provider}/bind 带 code/state', async () => {
    mock.onPost('/auth/oauth/github/bind').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ code: 'gh-code', state: 'st-1' })
      return [200, { code: 200, data: null }]
    })
    await auth.oauthBind('github', { code: 'gh-code', state: 'st-1' })
  })

  it('oauthUnbind 调 DELETE /auth/oauth/{provider}', async () => {
    mock.onDelete('/auth/oauth/google').reply(200, { code: 200, data: null })
    await auth.oauthUnbind('google')
  })

  it('oauthBind 失败 422 → reject 业务错误（拦截器已 toast）', async () => {
    mock.onPost('/auth/oauth/github/bind').reply(200, { code: 10301, message: 'already bound' })
    await expect(auth.oauthBind('github', { code: 'x', state: 's' })).rejects.toMatchObject({
      code: 10301,
    })
  })

  /* ── P6 MFA 登录二段 ── */
  it('loginMfaVerify 调 POST /auth/login/mfa-verify 带 mfaToken + code', async () => {
    mock.onPost('/auth/login/mfa-verify').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ mfaToken: 'mfa-1', code: '123456' })
      return [200, { code: 200, data: { token: 'final-tk', expireAt: Date.now() + 3600_000, user: { userId: 1 } } }]
    })
    const data = await auth.loginMfaVerify('mfa-1', '123456')
    expect(data.token).toBe('final-tk')
  })

  it('loginMfaVerify 失败 10402 → reject', async () => {
    mock.onPost('/auth/login/mfa-verify').reply(200, { code: 10402, message: 'invalid mfa code' })
    await expect(auth.loginMfaVerify('mfa-1', '000000')).rejects.toMatchObject({ code: 10402 })
  })
})
