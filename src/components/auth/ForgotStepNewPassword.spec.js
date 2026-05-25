/**
 * ForgotStepNewPassword — 单测（P2 密码重置 · Step 3）
 *
 * 行为契约：
 *   - 渲染两个密码输入 + "确认重置" CTA
 *   - 空 newPassword → 不 emit submit
 *   - newPassword < 8 位 → 不 emit submit
 *   - confirm !== new → 不 emit submit，显示 mismatch helper
 *   - 校验通过 → emit('submit', { newPassword })
 *   - loading 状态 CTA disabled
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ForgotStepNewPassword from './ForgotStepNewPassword.vue'

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
          stepNew: {
            section: 'New PW', stamp: 'STEP 3',
            newLabel: 'New', newHint: 'min 8', newPlaceholder: 'p', newHelper: 'help',
            newHelperRequired: 'req', newHelperWeak: 'weak',
            confirmLabel: 'Confirm', confirmHint: 'again', confirmPlaceholder: 'p',
            confirmHelper: 'match', confirmHelperMismatch: 'mismatch',
            toggleAria: 'toggle', cta: 'Confirm Reset', ctaBadge: '/R',
          },
        },
      },
    },
  },
})

const mountStep = (props = {}) =>
  mount(ForgotStepNewPassword, { props, global: { plugins: [i18n] } })

describe('ForgotStepNewPassword (P2)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('渲染两个密码输入 + Confirm CTA', () => {
    const w = mountStep()
    expect(w.findAll('input').length).toBe(2)
    expect(w.text()).toContain('Confirm Reset')
  })

  it('空密码不 emit submit', async () => {
    const w = mountStep()
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('密码 < 8 位不 emit submit', async () => {
    const w = mountStep()
    const inputs = w.findAll('input')
    await inputs[0].setValue('short')
    await inputs[1].setValue('short')
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('mismatch 不 emit submit', async () => {
    const w = mountStep()
    const inputs = w.findAll('input')
    await inputs[0].setValue('password123')
    await inputs[1].setValue('password456')
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('match + ≥8 位 emit submit', async () => {
    const w = mountStep()
    const inputs = w.findAll('input')
    await inputs[0].setValue('password123')
    await inputs[1].setValue('password123')
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
    expect(w.emitted('submit')[0][0]).toEqual({ newPassword: 'password123' })
  })

  it('loading=true 时 CTA disabled', () => {
    const w = mountStep({ loading: true })
    expect(w.find('button.ui-button').attributes('disabled')).toBeDefined()
  })
})
