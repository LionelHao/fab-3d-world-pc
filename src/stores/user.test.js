import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

/**
 * stores/user — PC 端用户鉴权 (user-auth P1)
 *
 * 验证：
 * - fab.pc.* 命名空间
 * - legacy pc_token / pc_userInfo 自动迁移
 * - expireAt / roles / userId / nickname getters
 * - isLoggedIn 考虑过期时间
 * - isAdmin 走 roles 数组 (admin 或 super_admin)
 * - hasRole getter
 * - updateToken / updateUser / login / logout actions
 */
describe('stores/user — PC 端用户鉴权 (P1)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  async function importStore() {
    const mod = await import('@/stores/user')
    return mod.useUserStore
  }

  it('初始未登录 (无 token)', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(store.expireAt).toBe(0)
  })

  it('login 写入 token / user / expireAt 到 fab.pc.* 命名空间', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    const exp = Date.now() + 3600_000
    store.login('tk-1', { userId: 1, nickname: 'lionel', roles: ['user'] }, exp)
    expect(store.isLoggedIn).toBe(true)
    expect(localStorage.getItem('fab.pc.token')).toBe('tk-1')
    expect(JSON.parse(localStorage.getItem('fab.pc.user')).userId).toBe(1)
    expect(localStorage.getItem('fab.pc.expireAt')).toBe(String(exp))
  })

  it('isLoggedIn 在 expireAt 过期时返回 false', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1 }, Date.now() - 1000)
    expect(store.isLoggedIn).toBe(false)
  })

  it('isLoggedIn 在 expireAt = 0 时仍为 true (兼容旧迁移)', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1 }, 0)
    // expireAt = 0 视为未知，由 refresh 拦截器接管
    expect(store.isLoggedIn).toBe(true)
  })

  it('isAdmin 在 roles 包含 admin 时为 true', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1, roles: ['admin'] }, Date.now() + 3600_000)
    expect(store.isAdmin).toBe(true)
  })

  it('isAdmin 在 roles 包含 super_admin 时为 true', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1, roles: ['super_admin'] }, Date.now() + 3600_000)
    expect(store.isAdmin).toBe(true)
  })

  it('isAdmin 在 roles 仅包含 user / creator 时为 false', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1, roles: ['user', 'creator'] }, Date.now() + 3600_000)
    expect(store.isAdmin).toBe(false)
  })

  it('isAdmin 在 roles 缺失时为 false', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1 }, Date.now() + 3600_000)
    expect(store.isAdmin).toBe(false)
  })

  it('hasRole 正确判定角色存在', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1, roles: ['user', 'moderator'] }, Date.now() + 3600_000)
    expect(store.hasRole('user')).toBe(true)
    expect(store.hasRole('moderator')).toBe(true)
    expect(store.hasRole('admin')).toBe(false)
  })

  it('userId / nickname getters 兼容多种字段', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk', { userId: 42, nickname: 'L', username: 'lionel' }, Date.now() + 3600_000)
    expect(store.userId).toBe(42)
    expect(store.nickname).toBe('L')
    store.logout()
    store.login('tk', { id: 7, username: 'fallback' }, Date.now() + 3600_000)
    expect(store.userId).toBe(7)
    expect(store.nickname).toBe('fallback')
  })

  it('updateToken 仅刷新 token + expireAt 而不动 user', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('old', { userId: 1, roles: ['user'] }, Date.now() + 1000)
    const newExp = Date.now() + 7200_000
    store.updateToken('new', newExp)
    expect(store.token).toBe('new')
    expect(store.expireAt).toBe(newExp)
    expect(store.user?.userId).toBe(1)
    expect(localStorage.getItem('fab.pc.token')).toBe('new')
  })

  it('updateUser 仅刷新 user', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk', { userId: 1, nickname: 'A' }, Date.now() + 3600_000)
    store.updateUser({ userId: 1, nickname: 'B', roles: ['admin'] })
    expect(store.user.nickname).toBe('B')
    expect(store.isAdmin).toBe(true)
  })

  it('logout 清空 state 与 localStorage', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk-1', { userId: 1 }, Date.now() + 3600_000)
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(localStorage.getItem('fab.pc.token')).toBeNull()
    expect(localStorage.getItem('fab.pc.user')).toBeNull()
    expect(localStorage.getItem('fab.pc.expireAt')).toBeNull()
  })

  it('migrateLegacy: pc_token + pc_userInfo 自动迁到 fab.pc.* 并清旧 key', async () => {
    localStorage.setItem('pc_token', 'old-tok')
    localStorage.setItem('pc_userInfo', JSON.stringify({ id: 7, role: 'user' }))
    const useUserStore = await importStore()
    const store = useUserStore()
    expect(localStorage.getItem('fab.pc.token')).toBe('old-tok')
    expect(localStorage.getItem('fab.pc.user')).toContain('"id":7')
    expect(localStorage.getItem('fab.pc.expireAt')).toBe('0')
    expect(localStorage.getItem('pc_token')).toBeNull()
    expect(localStorage.getItem('pc_userInfo')).toBeNull()
    expect(store.token).toBe('old-tok')
  })

  it('hasAnyRole 判断任一角色匹配', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk', { userId: 1, roles: ['user', 'creator'] }, Date.now() + 3600_000)
    expect(store.hasAnyRole(['admin', 'creator'])).toBe(true)
    expect(store.hasAnyRole(['admin', 'super_admin'])).toBe(false)
    expect(store.hasAnyRole([])).toBe(false)
  })

  it('isSuperAdmin / isModerator / isCreator / isVerifiedUser getters', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk', { userId: 1, roles: ['super_admin', 'moderator', 'creator', 'verified_user'] }, Date.now() + 3600_000)
    expect(store.isSuperAdmin).toBe(true)
    expect(store.isModerator).toBe(true)
    expect(store.isCreator).toBe(true)
    expect(store.isVerifiedUser).toBe(true)
    store.logout()
    store.login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    expect(store.isSuperAdmin).toBe(false)
    expect(store.isModerator).toBe(false)
  })

  it('roles getter 兼容 legacy user.role 单字符串', async () => {
    const useUserStore = await importStore()
    const store = useUserStore()
    store.login('tk', { userId: 1, role: 'creator' }, Date.now() + 3600_000)
    expect(store.roles).toEqual(['creator'])
    expect(store.isCreator).toBe(true)
  })

  it('migrateLegacy 不覆盖已存在的 fab.pc.token', async () => {
    localStorage.setItem('pc_token', 'old-tok')
    localStorage.setItem('fab.pc.token', 'new-tok')
    const useUserStore = await importStore()
    const store = useUserStore()
    expect(store.token).toBe('new-tok')
    expect(localStorage.getItem('pc_token')).toBeNull() // 旧 key 仍然清掉
  })
})
