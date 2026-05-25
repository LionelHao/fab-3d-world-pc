/**
 * MfaDisableDialog (PC) — 单测 (user-auth P6)
 *
 * 行为契约：
 *   - 渲染密码 + 6 位 code 输入 + 提交按钮
 *   - submit happy → 调 disable(pw, code) → emit disabled
 *   - 密码缺 / code 缺 → 提交按钮 disabled
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const disableMock = vi.fn()

vi.mock('@/service/mfa', () => ({
  disable: (...a) => disableMock(...a),
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
  const Comp = (await import('./MfaDisableDialog.vue')).default
  return mount(Comp, {
    attachTo: document.body,
    props: { modelValue: true },
    global: { plugins: [i18n] },
  })
}

describe('MfaDisableDialog (PC, P6)', () => {
  beforeEach(() => {
    disableMock.mockReset()
    document.body.innerHTML = ''
  })

  it('密码 + 6 位 code happy → 调 disable + emit disabled', async () => {
    disableMock.mockResolvedValueOnce({})
    const w = await mountDialog()
    await flushPromises()
    const pw = document.body.querySelector('[data-test="mfa-disable-password"]')
    const code = document.body.querySelector('[data-test="mfa-disable-code"]')
    pw.value = 'p@ss-1234'
    pw.dispatchEvent(new Event('input'))
    code.value = '123456'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-disable-submit"]').click()
    await flushPromises()
    expect(disableMock).toHaveBeenCalledWith('p@ss-1234', '123456')
    expect(w.emitted('disabled')).toBeTruthy()
  })

  it('密码缺 → submit 按钮 disabled', async () => {
    await mountDialog()
    await flushPromises()
    const code = document.body.querySelector('[data-test="mfa-disable-code"]')
    code.value = '123456'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    const btn = document.body.querySelector('[data-test="mfa-disable-submit"]')
    expect(btn.disabled).toBe(true)
  })

  it('disable 失败 10402 → 不 emit disabled', async () => {
    disableMock.mockRejectedValueOnce({ code: 10402 })
    const w = await mountDialog()
    await flushPromises()
    const pw = document.body.querySelector('[data-test="mfa-disable-password"]')
    const code = document.body.querySelector('[data-test="mfa-disable-code"]')
    pw.value = 'p'
    pw.dispatchEvent(new Event('input'))
    code.value = '000000'
    code.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-disable-submit"]').click()
    await flushPromises()
    expect(w.emitted('disabled')).toBeFalsy()
  })
})
