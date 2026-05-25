import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/i18n', () => ({
  t: (key) => key,
}))

/**
 * router/index — PC 路由守卫 (user-auth P1)
 *
 * 验证：
 * - requiresAuth + 未登录 → 跳 /login?from=...
 * - requiresAuth + 已登录 → 放行
 * - requiresRoles + 无匹配角色 → 跳 /home (含 toast)
 * - requiresRoles + 匹配角色 → 放行
 * - 已登录访问 /login → 跳 /home (toast 提示已登录)
 * - 公开页面 → 放行
 */
describe('router/index — 守卫 (P1)', () => {
  let router
  let useUserStore

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()

    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())

    const storeMod = await import('@/stores/user')
    useUserStore = storeMod.useUserStore

    const routerMod = await import('@/router')
    router = routerMod.default
    await router.push('/')
    await router.isReady()
  })

  it('公开页 /home 直接放行', async () => {
    await router.push('/home')
    expect(router.currentRoute.value.path).toBe('/home')
  })

  it('requiresAuth + 未登录 → 跳 /login 且带 query.from', async () => {
    await router.push('/profile')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.from).toBe('/profile')
  })

  it('requiresAuth + 已登录 → 放行', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    await router.push('/profile')
    expect(router.currentRoute.value.path).toBe('/profile')
  })

  it('requiresRoles + 非 admin 用户访问 /admin → 跳 /home', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/home')
  })

  it('requiresRoles + admin 用户访问 /admin → 放行', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['admin'] }, Date.now() + 3600_000)
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/admin')
  })

  it('requiresRoles + super_admin 用户访问 /admin → 放行', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['super_admin'] }, Date.now() + 3600_000)
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/admin')
  })

  it('已登录访问 /login → 跳 /home', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/home')
  })

  it('公开页 /forgot-password 未登录可直接访问 (P2)', async () => {
    await router.push('/forgot-password')
    expect(router.currentRoute.value.path).toBe('/forgot-password')
    expect(router.currentRoute.value.name).toBe('ForgotPassword')
  })

  it('已登录访问 /forgot-password 仍可访问 (P2, 不强制重定向)', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    await router.push('/forgot-password')
    expect(router.currentRoute.value.path).toBe('/forgot-password')
  })

  it('/settings/security 未登录 → 跳 /login 带 query.from (P3)', async () => {
    await router.push('/settings/security')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.from).toBe('/settings/security')
  })

  it('/settings/security 已登录 (普通 user) 可放行 (P3)', async () => {
    useUserStore().login('tk', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    await router.push('/settings/security')
    expect(router.currentRoute.value.path).toBe('/settings/security')
    expect(router.currentRoute.value.name).toBe('SettingsSecurity')
  })
})
