/**
 * Admin.vue — 视图层 role-based gating + activePane 切换（P4）
 *
 * 行为契约：
 *   - super_admin 看到 Roles 子 tab、Danger Zone 整段
 *   - 普通 admin 看不到 Roles 子 tab、看不到 Danger Zone
 *   - moderator 看到 §05 System 但仅 Audit Log
 *   - activeTab=02.1 → 渲染 AdminUserMgmt
 *   - activeTab=05.1 → 渲染 AdminAuditTable
 *   - activeTab=01.1 → 渲染 dashboard 视觉壳
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/service/admin', () => ({
  getDashboard: vi.fn().mockResolvedValue({}),
  listUsers: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  listLoginEvents: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  listPosts: vi.fn().mockResolvedValue([]),
  listOrders: vi.fn().mockResolvedValue([]),
  getUserDetail: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  setUserRoles: vi.fn(),
  revokeAllSessions: vi.fn(),
}))

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
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

let lastW = null

async function mountAdmin(roles = ['admin']) {
  localStorage.clear()
  setActivePinia(createPinia())
  const { useUserStore } = await import('@/stores/user')
  const s = useUserStore()
  s.login('tk', { userId: 99, roles }, Date.now() + 3600_000)

  const i18n = await loadI18n()
  const C = (await import('./Admin.vue')).default
  const w = mount(C, {
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  lastW = w
  return w
}

describe('Admin.vue (P4 role-gated)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (lastW) { lastW.unmount(); lastW = null }
    document.body.innerHTML = ''
  })

  it('super_admin 看到 Danger Zone 整段 + Roles 子 tab', async () => {
    const w = await mountAdmin(['super_admin'])
    const text = w.text()
    expect(text).toContain('Danger Zone')
    expect(text).toContain('Roles')
  })

  it('普通 admin 看不到 Danger Zone + 看不到 Roles 子 tab', async () => {
    const w = await mountAdmin(['admin'])
    const text = w.text()
    expect(text).not.toContain('Danger Zone')
    // Roles 子 tab 不渲染（System Audit Log 与 Reports 不含 "Roles"）
    expect(text).not.toContain('02.R')
  })

  it('moderator 看 §05 System 但仅 Audit Log 子 tab', async () => {
    const w = await mountAdmin(['moderator'])
    const text = w.text()
    expect(text).toContain('System')
    expect(text).toContain('Audit Log')
    // 非 super_admin 不应看到 Config / API Keys / Webhooks
    expect(text).not.toContain('API Keys')
  })

  it('activeTab=02.1 → 渲染 AdminUserMgmt pane', async () => {
    const w = await mountAdmin(['super_admin'])
    w.vm.activeTab = '02.1'
    await flushPromises()
    expect(w.find('[data-test="pane-users"]').exists()).toBe(true)
  })

  it('activeTab=05.1 → 渲染 AdminAuditTable pane', async () => {
    const w = await mountAdmin(['super_admin'])
    w.vm.activeTab = '05.1'
    await flushPromises()
    expect(w.find('[data-test="pane-audit"]').exists()).toBe(true)
  })

  it('activeTab=01.1 (default) → 渲染 dashboard 视觉壳 (Stream / Alerts / Tickets)', async () => {
    const w = await mountAdmin(['super_admin'])
    // 默认 activeTab = 01.1
    expect(w.find('[data-test="pane-users"]').exists()).toBe(false)
    expect(w.find('[data-test="pane-audit"]').exists()).toBe(false)
    expect(w.text()).toContain('Stream')
  })
})
