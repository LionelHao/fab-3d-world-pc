/**
 * CaptchaWidget (PC) — 单测 (user-auth P6)
 *
 * 行为契约：
 *   - provider='mock' → 渲染 checkbox + label，点 checkbox 后 emit token='mock-pass'
 *   - provider='hcaptcha' → 占位 div + siteKey 渲染，TODO 真 SDK
 *   - provider='turnstile' → 占位 div
 *   - 切 provider 时 token 清空
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  }
})

async function mountWidget(props = {}, locale = 'en-US') {
  const auth = (await import(`@/locales/${locale}/auth.json`)).default
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: locale,
    messages: { [locale]: { auth } },
  })
  const Comp = (await import('./CaptchaWidget.vue')).default
  return mount(Comp, { props, global: { plugins: [i18n] } })
}

describe('CaptchaWidget (PC, P6)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('provider=mock → 渲染 checkbox + 文案', async () => {
    const w = await mountWidget({ provider: 'mock' })
    await flushPromises()
    expect(w.find('[data-test="captcha-widget"]').exists()).toBe(true)
    expect(w.find('[data-test="captcha-mock-checkbox"]').exists()).toBe(true)
  })

  it('provider=mock → 点 checkbox emit verified token=mock-pass', async () => {
    const w = await mountWidget({ provider: 'mock' })
    await flushPromises()
    const cb = w.find('[data-test="captcha-mock-checkbox"]')
    await cb.setValue(true)
    await flushPromises()
    const emitted = w.emitted('verified')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ token: 'mock-pass' })
  })

  it('provider=hcaptcha → 渲染 hcaptcha 占位 + siteKey 属性', async () => {
    const w = await mountWidget({ provider: 'hcaptcha', siteKey: 'sk-xxx' })
    await flushPromises()
    const slot = w.find('[data-test="captcha-hcaptcha"]')
    expect(slot.exists()).toBe(true)
    expect(slot.attributes('data-sitekey')).toBe('sk-xxx')
  })

  it('provider 切换 → token 清空', async () => {
    const w = await mountWidget({ provider: 'mock' })
    await flushPromises()
    await w.find('[data-test="captcha-mock-checkbox"]').setValue(true)
    await flushPromises()
    await w.setProps({ provider: 'hcaptcha', siteKey: 'sk' })
    await flushPromises()
    // 验证：切换后 emitted('verified') 收到 null
    const ev = w.emitted('verified') || []
    expect(ev.some((e) => e[0]?.token == null)).toBe(true)
  })
})
