/**
 * service/captcha — PC 端人机验证接口单测 (user-auth P6)
 *
 * 契约:
 *   getConfig(scene)   → GET /captcha/config?scene=<scene>  ⇒ {provider, siteKey, required}
 *   verify(payload)    → POST /captcha/verify              ⇒ {ok}
 *
 * provider 取值：'mock' / 'hcaptcha' / 'turnstile'（mock dev 友好 dev-only）
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

describe('service/captcha — PC P6 人机验证', () => {
  let axios
  let mock
  let captcha

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const axiosMod = await import('@/utils/axios')
    axios = axiosMod.default
    mock = new MockAdapter(axios)
    captcha = await import('@/service/captcha')
  })

  afterEach(() => {
    mock.restore()
  })

  it('getConfig 调 GET /captcha/config 带 scene 返回 provider/siteKey/required', async () => {
    mock.onGet('/captcha/config').reply((config) => {
      expect(config.params).toEqual({ scene: 'login' })
      return [200, { code: 200, data: { provider: 'mock', siteKey: '', required: false } }]
    })
    const data = await captcha.getConfig('login')
    expect(data.provider).toBe('mock')
  })

  it('getConfig required=true 时返回 siteKey', async () => {
    mock.onGet('/captcha/config').reply(200, {
      code: 200,
      data: { provider: 'hcaptcha', siteKey: 'sk-xxx', required: true },
    })
    const data = await captcha.getConfig('signup')
    expect(data.required).toBe(true)
    expect(data.siteKey).toBe('sk-xxx')
  })

  it('verify 调 POST /captcha/verify 带 token + scene', async () => {
    mock.onPost('/captcha/verify').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ token: 'tk-abc', scene: 'login' })
      return [200, { code: 200, data: { ok: true } }]
    })
    const data = await captcha.verify({ token: 'tk-abc', scene: 'login' })
    expect(data.ok).toBe(true)
  })
})
