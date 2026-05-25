/**
 * MfaRecoveryRegenDialog (PC) — 单测 (user-auth P6)
 *
 * 行为契约：
 *   - step=1：输入 6 位 code + 警告文案 + 提交
 *   - submit happy → 调 regenerateRecoveryCodes(code) → 切 step=2 显示 10 codes
 *   - 失败 10402 → 不切 step
 *   - step=2：ack checkbox → 完成 → emit regenerated
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const regenMock = vi.fn()

vi.mock('@/service/mfa', () => ({
  regenerateRecoveryCodes: (...a) => regenMock(...a),
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
  const Comp = (await import('./MfaRecoveryRegenDialog.vue')).default
  return mount(Comp, {
    attachTo: document.body,
    props: { modelValue: true },
    global: { plugins: [i18n] },
  })
}

describe('MfaRecoveryRegenDialog (PC, P6)', () => {
  beforeEach(() => {
    regenMock.mockReset()
    document.body.innerHTML = ''
  })

  it('submit happy → 调 regenerateRecoveryCodes 并展示 10 codes', async () => {
    regenMock.mockResolvedValueOnce({
      recoveryCodes: Array.from({ length: 10 }, (_, i) => `n${i}`),
    })
    await mountDialog()
    await flushPromises()
    const code = document.body.querySelector('[data-test="mfa-regen-code"]')
    code.value = '123456'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-regen-submit"]').click()
    await flushPromises()
    expect(regenMock).toHaveBeenCalledWith('123456')
    expect(document.body.textContent).toContain('n0')
    expect(document.body.textContent).toContain('n9')
  })

  it('submit reject 10402 → 不切 step', async () => {
    regenMock.mockRejectedValueOnce({ code: 10402 })
    await mountDialog()
    await flushPromises()
    const code = document.body.querySelector('[data-test="mfa-regen-code"]')
    code.value = '000000'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-regen-submit"]').click()
    await flushPromises()
    expect(regenMock).toHaveBeenCalled()
    expect(document.body.querySelector('[data-test="mfa-regen-finish"]')).toBeNull()
  })

  it('step 2 ack + finish → emit regenerated', async () => {
    regenMock.mockResolvedValueOnce({
      recoveryCodes: Array.from({ length: 10 }, (_, i) => `k${i}`),
    })
    const w = await mountDialog()
    await flushPromises()
    const code = document.body.querySelector('[data-test="mfa-regen-code"]')
    code.value = '123456'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-regen-submit"]').click()
    await flushPromises()
    const finish = document.body.querySelector('[data-test="mfa-regen-finish"]')
    expect(finish.disabled).toBe(true)
    const ack = document.body.querySelector('[data-test="mfa-regen-ack"]')
    ack.checked = true
    ack.dispatchEvent(new Event('change'))
    await flushPromises()
    expect(finish.disabled).toBe(false)
    finish.click()
    await flushPromises()
    expect(w.emitted('regenerated')).toBeTruthy()
  })
})
