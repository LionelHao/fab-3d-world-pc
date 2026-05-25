/**
 * ForgotStepIdentifier — 单测（P2 密码重置 · Step 1）
 *
 * 行为契约：
 *   - 渲染 identifier 输入 + "发送验证码" CTA
 *   - 空 identifier 点击 CTA → 不 emit('submit')，显示 helper 警告
 *   - 有 identifier 点击 CTA → emit('submit', { identifier })
 *   - loading 时 CTA 禁用，不重复 emit
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ForgotStepIdentifier from './ForgotStepIdentifier.vue'

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
          stepIdentifier: {
            section: 'Account', stamp: 'STEP 1', label: 'ID', hint: 'h', placeholder: 'p',
            helper: 'help', helperRequired: 'required', cta: 'Send', ctaBadge: '/S',
          },
        },
      },
    },
  },
})

const mountStep = (props = {}) =>
  mount(ForgotStepIdentifier, { props, global: { plugins: [i18n] } })

describe('ForgotStepIdentifier (P2)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('渲染 input + send CTA', () => {
    const w = mountStep()
    expect(w.find('input').exists()).toBe(true)
    expect(w.text()).toContain('Send')
  })

  it('空 identifier 点 CTA 不 emit submit', async () => {
    const w = mountStep()
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })

  it('填 identifier 点 CTA emit submit 带 identifier', async () => {
    const w = mountStep({ identifier: 'user@fab.io' })
    await w.find('button.ui-button').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
    expect(w.emitted('submit')[0][0]).toEqual({ identifier: 'user@fab.io' })
  })

  it('loading=true 时 CTA 禁用', () => {
    const w = mountStep({ loading: true })
    expect(w.find('button.ui-button').attributes('disabled')).toBeDefined()
  })

  it('v-model:identifier 双向绑定', async () => {
    const w = mountStep({ identifier: 'init' })
    expect(w.find('input').element.value).toBe('init')
    await w.find('input').setValue('changed')
    expect(w.emitted('update:identifier')).toBeTruthy()
    expect(w.emitted('update:identifier').at(-1)[0]).toBe('changed')
  })
})
