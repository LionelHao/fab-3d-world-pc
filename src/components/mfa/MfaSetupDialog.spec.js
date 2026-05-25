/**
 * MfaSetupDialog (PC) — 单测 (user-auth P6)
 *
 * 行为契约：
 *   - open 后 step=1：调 setup() → 显示 QR + secret fallback
 *   - step 1 → 输入 6 位 code → 点 Next → 调 verifySetup(code) → 切 step 2
 *   - step 2：显示 10 个 recovery codes + 复制 ack 二次确认 + 完成按钮
 *   - 完成按钮：钩 finish 事件给父
 *   - setup 失败 → errors.invalidCode toast，不切 step
 *   - verifySetup 10402 → errors.invalidCode toast
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const setupMock = vi.fn()
const verifySetupMock = vi.fn()

vi.mock('@/service/mfa', () => ({
  setup: (...a) => setupMock(...a),
  verifySetup: (...a) => verifySetupMock(...a),
}))

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

async function loadMessages(locale = 'en-US') {
  const auth = (await import(`@/locales/${locale}/auth.json`)).default
  const common = (await import(`@/locales/${locale}/common.json`)).default
  return { auth, common }
}

async function mountDialog(locale = 'en-US', props = {}) {
  setActivePinia(createPinia())
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: locale,
    messages: { [locale]: await loadMessages(locale) },
  })
  const Comp = (await import('./MfaSetupDialog.vue')).default
  return mount(Comp, {
    attachTo: document.body,
    props: { modelValue: true, ...props },
    global: { plugins: [i18n] },
  })
}

describe('MfaSetupDialog (PC, P6)', () => {
  beforeEach(() => {
    setupMock.mockReset()
    verifySetupMock.mockReset()
    document.body.innerHTML = ''
  })

  it('open 后调 setup() 并显示 QR / secret', async () => {
    setupMock.mockResolvedValueOnce({
      secret: 'JBSWY3DPEHPK3PXP',
      qrUrl: 'otpauth://totp/Fab:lionel?secret=JBSWY3DPEHPK3PXP',
    })
    await mountDialog()
    await flushPromises()
    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).toContain('JBSWY3DPEHPK3PXP')
  })

  it('verifySetup happy → 切 step 2 显示 10 个 recovery codes', async () => {
    setupMock.mockResolvedValueOnce({ secret: 'S', qrUrl: 'otpauth://...' })
    verifySetupMock.mockResolvedValueOnce({
      recoveryCodes: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'],
    })
    const w = await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-setup-code"]')
    codeInput.value = '123456'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-setup-verify"]').click()
    await flushPromises()
    expect(verifySetupMock).toHaveBeenCalledWith('123456')
    // recovery codes step
    expect(document.body.textContent).toContain('c1')
    expect(document.body.textContent).toContain('c10')
  })

  it('完成按钮 disabled 直到 ack checkbox 勾选；勾选后 emit finish', async () => {
    setupMock.mockResolvedValueOnce({ secret: 'S', qrUrl: 'q' })
    verifySetupMock.mockResolvedValueOnce({ recoveryCodes: Array.from({ length: 10 }, (_, i) => `r${i}`) })
    const w = await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-setup-code"]')
    codeInput.value = '123456'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-setup-verify"]').click()
    await flushPromises()

    const finish = document.body.querySelector('[data-test="mfa-setup-finish"]')
    expect(finish.disabled).toBe(true)
    const ack = document.body.querySelector('[data-test="mfa-setup-ack"]')
    ack.checked = true
    ack.dispatchEvent(new Event('change'))
    await flushPromises()
    expect(finish.disabled).toBe(false)
    finish.click()
    await flushPromises()
    expect(w.emitted('finish')).toBeTruthy()
  })

  it('setup reject → 不崩，secret 为空', async () => {
    setupMock.mockRejectedValueOnce({ code: 500 })
    await mountDialog()
    await flushPromises()
    // dialog still renders but no secret text
    expect(document.body.textContent).not.toContain('JBSWY3DPEHPK3PXP')
  })

  it('verifySetup reject 10402 → 不切 step，code 字段留住', async () => {
    setupMock.mockResolvedValueOnce({ secret: 'S', qrUrl: 'q' })
    verifySetupMock.mockRejectedValueOnce({ code: 10402, message: 'invalid' })
    const w = await mountDialog()
    await flushPromises()
    const codeInput = document.body.querySelector('[data-test="mfa-setup-code"]')
    codeInput.value = '000000'
    codeInput.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body.querySelector('[data-test="mfa-setup-verify"]').click()
    await flushPromises()
    expect(verifySetupMock).toHaveBeenCalled()
    // still on step 1, finish button absent
    expect(document.body.querySelector('[data-test="mfa-setup-finish"]')).toBeNull()
  })
})
