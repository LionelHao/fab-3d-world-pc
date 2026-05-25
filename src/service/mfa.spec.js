/**
 * service/mfa — PC 端两步验证 service 单测 (user-auth P6)
 *
 * 契约 (与 backend MFA 6 端点对齐):
 *   setup()                            → POST /mfa/setup            ⇒ {secret,qrUrl}
 *   verifySetup(code)                  → POST /mfa/verify-setup     ⇒ {recoveryCodes:[10]}
 *   verify(code)                       → POST /mfa/verify           ⇒ {ok:true}
 *   disable(password, code)            → POST /mfa/disable          ⇒ {}
 *   status()                           → GET  /mfa/status           ⇒ {enabled, recoveryRemaining}
 *   regenerateRecoveryCodes(code)      → POST /mfa/recovery-codes   ⇒ {recoveryCodes:[10]}
 */
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

describe('service/mfa — PC P6 两步验证接口', () => {
  let axios
  let mock
  let mfa

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const axiosMod = await import('@/utils/axios')
    axios = axiosMod.default
    mock = new MockAdapter(axios)
    mfa = await import('@/service/mfa')
  })

  afterEach(() => {
    mock.restore()
  })

  it('setup 调 POST /mfa/setup 返回 secret + qrUrl', async () => {
    mock.onPost('/mfa/setup').reply(200, {
      code: 200,
      data: { secret: 'JBSWY3DPEHPK3PXP', qrUrl: 'otpauth://totp/Fab:lionel?secret=JBSWY...' },
    })
    const data = await mfa.setup()
    expect(data.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(data.qrUrl).toContain('otpauth://')
  })

  it('verifySetup 调 POST /mfa/verify-setup 带 code 返回 recoveryCodes', async () => {
    mock.onPost('/mfa/verify-setup').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ code: '123456' })
      return [200, { code: 200, data: { recoveryCodes: Array(10).fill('abcd-1234') } }]
    })
    const data = await mfa.verifySetup('123456')
    expect(data.recoveryCodes).toHaveLength(10)
  })

  it('verify 调 POST /mfa/verify 带 code 返回 ok', async () => {
    mock.onPost('/mfa/verify').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ code: '654321' })
      return [200, { code: 200, data: { ok: true } }]
    })
    const data = await mfa.verify('654321')
    expect(data.ok).toBe(true)
  })

  it('disable 调 POST /mfa/disable 带 password + code', async () => {
    mock.onPost('/mfa/disable').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ password: 'p@ss', code: '999000' })
      return [200, { code: 200, data: {} }]
    })
    await mfa.disable('p@ss', '999000')
  })

  it('status 调 GET /mfa/status 返回 enabled+recoveryRemaining', async () => {
    mock.onGet('/mfa/status').reply(200, {
      code: 200,
      data: { enabled: true, recoveryRemaining: 7 },
    })
    const data = await mfa.status()
    expect(data.enabled).toBe(true)
    expect(data.recoveryRemaining).toBe(7)
  })

  it('regenerateRecoveryCodes 调 POST /mfa/recovery-codes 带 code 返回新 10 码', async () => {
    mock.onPost('/mfa/recovery-codes').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ code: '111222' })
      return [200, { code: 200, data: { recoveryCodes: Array(10).fill('zzzz-9999') } }]
    })
    const data = await mfa.regenerateRecoveryCodes('111222')
    expect(data.recoveryCodes).toHaveLength(10)
  })

  it('verify 失败 10402 → reject 业务错误（拦截器已 toast）', async () => {
    mock.onPost('/mfa/verify').reply(200, { code: 10402, message: 'invalid mfa code' })
    await expect(mfa.verify('000000')).rejects.toMatchObject({ code: 10402 })
  })
})
