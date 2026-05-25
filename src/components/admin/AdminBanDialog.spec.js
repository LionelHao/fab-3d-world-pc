/**
 * AdminBanDialog — 封禁用户对话框（P4）
 *
 * 行为契约：
 *   - props: open(v-model) / user
 *   - reason 必填，untilAt 可选；reason 空 → submit 不 emit + 提示
 *   - submit happy → emit('submit', { reason, untilAt }) + emit 'update:open' false
 *   - cancel → emit 'update:open' false
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const elMessageWarning = vi.fn()
const elMessageError = vi.fn()

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: elMessageError,
      warning: elMessageWarning,
      info: vi.fn(),
    },
  }
})

async function loadI18n() {
  const adminZh = (await import('@/locales/zh-CN/admin.json')).default
  const commonZh = (await import('@/locales/zh-CN/common.json')).default
  return createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: { 'zh-CN': { admin: adminZh, common: commonZh } },
  })
}

async function mountDialog(props = {}) {
  const i18n = await loadI18n()
  const AdminBanDialog = (await import('./AdminBanDialog.vue')).default
  const w = mount(AdminBanDialog, {
    props: { open: true, user: { userId: 7, username: 'lionel' }, ...props },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  await new Promise((r) => setTimeout(r, 0))
  return w
}

describe('AdminBanDialog (P4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('open=true → 渲染 dialog 含用户名', async () => {
    const w = await mountDialog()
    // ElDialog teleport → document.body
    const text = document.body.textContent
    expect(text).toContain('lionel')
  })

  it('reason 空 → 点 submit 不 emit submit + warning toast', async () => {
    const w = await mountDialog()
    const btn = document.querySelector('[data-test="adm-ban-submit"]')
    expect(btn).not.toBeNull()
    btn.click()
    await flushPromises()
    expect(w.emitted('submit')).toBeFalsy()
    expect(elMessageWarning).toHaveBeenCalled()
  })

  it('reason 填了 → 点 submit emit submit 含 reason', async () => {
    const w = await mountDialog()
    // ElDialog teleport 到 body；ElInput textarea 找 .el-dialog 内首个 textarea
    const input = document.querySelector('.el-dialog textarea, .el-dialog input[type="text"]')
    expect(input).not.toBeNull()
    input.value = 'spam'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    document.querySelector('[data-test="adm-ban-submit"]').click()
    await flushPromises()
    const ev = w.emitted('submit')
    expect(ev).toBeTruthy()
    expect(ev[0][0].reason).toBe('spam')
  })

  it('点 cancel → emit update:open false', async () => {
    const w = await mountDialog()
    document.querySelector('[data-test="adm-ban-cancel"]').click()
    await flushPromises()
    expect(w.emitted('update:open')).toBeTruthy()
    expect(w.emitted('update:open')[0][0]).toBe(false)
  })
})
