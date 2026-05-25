/**
 * AdminUserMgmt — 用户管理页（P4）
 *
 * 行为契约：
 *   - mount → 调 listUsers(默认参数)
 *   - 渲染数据行（脱敏字段直接来自后端）
 *   - 搜索 → 重新调 listUsers with keyword
 *   - 状态/角色过滤 → listUsers with status/role
 *   - 分页 → listUsers with page
 *   - 操作列：详情 → 调 getUserDetail + 弹 drawer
 *   - 角色编辑：仅 super_admin 显示
 *   - ban → 弹 dialog → submit → 调 banUser → success toast + 刷新列表
 *   - unban → confirm → 调 unbanUser
 *   - revokeAll → confirm → 调 revokeAllSessions
 *   - listUsers reject → empty 状态 + error toast
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'

const listUsersMock = vi.fn()
const getUserDetailMock = vi.fn()
const banUserMock = vi.fn()
const unbanUserMock = vi.fn()
const setUserRolesMock = vi.fn()
const revokeAllSessionsMock = vi.fn()

vi.mock('@/service/admin', () => ({
  listUsers: (...a) => listUsersMock(...a),
  getUserDetail: (...a) => getUserDetailMock(...a),
  banUser: (...a) => banUserMock(...a),
  unbanUser: (...a) => unbanUserMock(...a),
  setUserRoles: (...a) => setUserRolesMock(...a),
  revokeAllSessions: (...a) => revokeAllSessionsMock(...a),
}))

const elConfirmMock = vi.fn()
const elSuccessMock = vi.fn()
const elErrorMock = vi.fn()
const elWarningMock = vi.fn()

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: elSuccessMock, error: elErrorMock, warning: elWarningMock, info: vi.fn() },
    ElMessageBox: {
      confirm: (...a) => elConfirmMock(...a),
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

let lastW = null

async function mountComp(userOverride = { userId: 99, roles: ['super_admin'] }) {
  setActivePinia(createPinia())
  const { useUserStore } = await import('@/stores/user')
  const store = useUserStore()
  store.login('tk', userOverride, Date.now() + 3600_000)

  const i18n = await loadI18n()
  const C = (await import('./AdminUserMgmt.vue')).default
  const w = mount(C, {
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  lastW = w
  return w
}

describe('AdminUserMgmt (P4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    if (lastW) { lastW.unmount(); lastW = null }
    document.body.innerHTML = ''
    listUsersMock.mockResolvedValue({
      rows: [
        { userId: 1, username: 'alice', phoneMasked: '138****0001', emailMasked: 'a****@x.com', status: 'NORMAL', roles: ['user', 'creator'], lastLoginAt: '2026-05-25T10:00:00Z' },
        { userId: 2, username: 'bob', phoneMasked: '138****0002', emailMasked: 'b****@x.com', status: 'BANNED', roles: ['user'], lastLoginAt: '2026-05-20T10:00:00Z' },
      ],
      total: 2,
      page: 1,
      size: 20,
    })
    getUserDetailMock.mockResolvedValue({
      userId: 1, username: 'alice', activeSessions: 2, events: []
    })
    banUserMock.mockResolvedValue({})
    unbanUserMock.mockResolvedValue({})
    setUserRolesMock.mockResolvedValue({})
    revokeAllSessionsMock.mockResolvedValue({ revokedCount: 3 })
    elConfirmMock.mockResolvedValue('confirm')
  })

  it('mount → 调 listUsers + 渲染 2 行', async () => {
    const w = await mountComp()
    expect(listUsersMock).toHaveBeenCalledTimes(1)
    const rows = w.findAll('tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(w.text()).toContain('alice')
    expect(w.text()).toContain('bob')
  })

  it('listUsers reject → empty 状态 + error toast', async () => {
    listUsersMock.mockRejectedValueOnce(new Error('boom'))
    const w = await mountComp()
    expect(w.text()).toContain('暂无用户')
    expect(elErrorMock).toHaveBeenCalled()
  })

  it('搜索 → 调 listUsers with keyword', async () => {
    const w = await mountComp()
    listUsersMock.mockClear()
    const input = w.find('[data-test="adm-users-search"] input')
    await input.setValue('lionel')
    await w.find('[data-test="adm-users-search-btn"]').trigger('click')
    await flushPromises()
    expect(listUsersMock).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'lionel' }))
  })

  it('点 ban 按钮 → 弹 BanDialog → submit → 调 banUser', async () => {
    const w = await mountComp()
    await w.find('[data-test="adm-users-ban-1"]').trigger('click')
    await flushPromises()
    // 模拟 BanDialog emit submit
    const dialog = w.findComponent({ name: 'AdminBanDialog' })
    expect(dialog.exists()).toBe(true)
    dialog.vm.$emit('submit', { reason: 'spam' })
    await flushPromises()
    expect(banUserMock).toHaveBeenCalledWith(1, { reason: 'spam' })
    expect(elSuccessMock).toHaveBeenCalled()
  })

  it('点 unban 按钮 → confirm → 调 unbanUser', async () => {
    const w = await mountComp()
    await w.find('[data-test="adm-users-unban-2"]').trigger('click')
    await flushPromises()
    expect(elConfirmMock).toHaveBeenCalled()
    expect(unbanUserMock).toHaveBeenCalledWith(2)
  })

  it('点 revokeAll 按钮 → confirm → 调 revokeAllSessions', async () => {
    const w = await mountComp()
    await w.find('[data-test="adm-users-revoke-1"]').trigger('click')
    await flushPromises()
    expect(elConfirmMock).toHaveBeenCalled()
    expect(revokeAllSessionsMock).toHaveBeenCalledWith(1)
  })

  it('点 detail 按钮 → 调 getUserDetail + 打开 drawer', async () => {
    const w = await mountComp()
    await w.find('[data-test="adm-users-detail-1"]').trigger('click')
    await flushPromises()
    expect(getUserDetailMock).toHaveBeenCalledWith(1)
    const drawer = w.findComponent({ name: 'AdminUserDetailDrawer' })
    expect(drawer.exists()).toBe(true)
  })

  it('super_admin 看得到「编辑角色」按钮', async () => {
    const w = await mountComp({ userId: 99, roles: ['super_admin'] })
    expect(w.find('[data-test="adm-users-roles-1"]').exists()).toBe(true)
  })

  it('普通 admin 看不到「编辑角色」按钮', async () => {
    const w = await mountComp({ userId: 99, roles: ['admin'] })
    expect(w.find('[data-test="adm-users-roles-1"]').exists()).toBe(false)
  })

  it('角色编辑 dialog submit → 调 setUserRoles', async () => {
    const w = await mountComp({ userId: 99, roles: ['super_admin'] })
    await w.find('[data-test="adm-users-roles-1"]').trigger('click')
    await flushPromises()
    const dialog = w.findComponent({ name: 'AdminRoleEditDialog' })
    expect(dialog.exists()).toBe(true)
    dialog.vm.$emit('submit', { add: ['admin'], remove: [] })
    await flushPromises()
    expect(setUserRolesMock).toHaveBeenCalledWith(1, { add: ['admin'], remove: [] })
  })
})
