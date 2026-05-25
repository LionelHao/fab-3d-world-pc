/**
 * MfaVerifyDialog (PC) — 单测 (user-auth P6)
 *
 * 行为契约：
 *   - 渲染 6 位 code 输入 + 验证按钮
 *   - submit code → 调 verify(code) → emit verified
 *   - 失败 10402 → 不 emit
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const verifyMock = vi.fn()

vi.mock('@/service/mfa', () => ({
  verify: (...a) => verifyMock(...a),
}))

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  }
})

async function mountDialog(locale = 'en-US') {
  setActivePinia(createPinia())
  const auth = (await import(`@/locales/${locale}/auth.json`)).default
  const common = (await import(`@/locales/${locale}/common.json`)).default
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: locale,
    messages: { [locale]: { auth, common } },
  })
  const Comp = (await import('./MfaVerifyDialog.vue')).default
  return mount(Comp, {
    attachTo: document.body,
    props: { modelValue: true },
    global: { plugins: [i18n] },
  })
}

describe('MfaVerifyDialog (PC, P6)', () => {
  beforeEach(() => {
    verifyMock.mockReset()
    document.body.innerHTML = ''
  })

  it('submit 6 位 code happy → 调 verify → emit verified', async () => {
    verifyMock.mockResolvedValueOnce({ ok: true })
    const w = await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-verify-code"]')
    codeInput.value = '123456'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-verify-submit"]').click()
    await flushPromises()
    expect(verifyMock).toHaveBeenCalledWith('123456')
    expect(w.emitted('verified')).toBeTruthy()
  })

  it('verify reject 10402 → 不 emit verified', async () => {
    verifyMock.mockRejectedValueOnce({ code: 10402 })
    const w = await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-verify-code"]')
    codeInput.value = '000000'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-verify-submit"]').click()
    await flushPromises()
    expect(verifyMock).toHaveBeenCalled()
    expect(w.emitted('verified')).toBeFalsy()
  })

  it('code 不足 6 位 → submit 按钮 disabled', async () => {
    await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-verify-code"]')
    codeInput.value = '12'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    const btn = document.body.querySelector('[data-test="mfa-verify-submit"]')
    expect(btn.disabled).toBe(true)
  })
})
