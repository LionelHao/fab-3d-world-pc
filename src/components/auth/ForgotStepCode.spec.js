/**
 * ForgotStepCode — 单测（P2 密码重置 · Step 2）
 *
 * 行为契约：
 *   - 渲染 6 位 code input + "下一步" CTA + resend 文案
 *   - resendRemaining > 0 → resend 不可点击
 *   - resendRemaining === 0 → click resend emit('resend')
 *   - 空/非 6 位 code 不 emit submit
 *   - 6 位 code 点 CTA emit('submit', { code })
 *   - target 显示在 helper 文本里
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ForgotStepCode from './ForgotStepCode.vue'

vi.mock('element-plus', () => ({
  ElMessage: { warning: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        forgot: {
          stepCode: {
            section: 'Verify', stamp: 'STEP 2', label: 'Code', hint: '6 digits',
            placeholder: '------', helper: 'Code sent to {target}', helperRequired: 'required',
            resend: 'Resend', resendLabel: 'Resend', resendReady: 'Resend Now',
            cta: 'Next', ctaBadge: '/N',
          },
        },
      },
    },
  },
})

const mountStep = (props = {}) =>
  mount(ForgotStepCode, {
    props: { target: 'user@fab.io', resendRemaining: 0, ...props },
    global: { plugins: [i18n] },
  })

describe('ForgotStepCode (P2)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('渲染 code input + Next CTA + target 文案', () => {
    const w = mountStep()
    expect(w.find('input').exists()).toBe(true)
    expect(w.text()).toContain('Next')
    expect(w.text()).toContain('user@fab.io')
  })

  it('resendRemaining > 0 时 resend 禁用且显示倒计时', () => {
    const w = mountStep({ resendRemaining: 45 })
    const resendBtn = w.find('[data-testid="resend-btn"]')
    expect(resendBtn.exists()).toBe(true)
    expect(resendBtn.attributes('disabled')).toBeDefined()
    expect(resendBtn.text()).toContain('45')
  })

  it('resendRemaining === 0 时 resend 可点击并 emit', async () => {
    const w = mountStep({ resendRemaining: 0 })
    const resendBtn = w.find('[data-testid="resend-btn"]')
    expect(resendBtn.attributes('disabled')).toBeUndefined()
    await resendBtn.trigger('click')
    expect(w.emitted('resend')).toBeTruthy()
  })

  it('空 code 点 CTA 不 emit submit', async () => {
    const w = mountStep()
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('非 6 位 code 不 emit submit', async () => {
    const w = mountStep({ code: '123' })
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('6 位 code 点 CTA emit submit', async () => {
    const w = mountStep({ code: '123456' })
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
    expect(w.emitted('submit')[0][0]).toEqual({ code: '123456' })
  })

  it('输入非数字字符自动剥离', async () => {
    const w = mountStep()
    await w.find('input').setValue('abc12-3def4')
    expect(w.emitted('update:code')).toBeTruthy()
    expect(w.emitted('update:code').at(-1)[0]).toBe('1234')
  })

  it('loading=true 时 CTA disabled', () => {
    const w = mountStep({ loading: true })
    expect(w.find('button.ui-button').attributes('disabled')).toBeDefined()
  })
})
