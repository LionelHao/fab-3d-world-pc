/**
 * E2E — PC Admin RBAC gating (user-auth P4)
 *
 * Spec: docs/user-auth-impl.md §2 + §7.3 + 总体 §11 P4
 *
 * Cases:
 *   1. non-admin (user only) 访问 /admin → 跳 /home（含 forbidden toast）
 *   2. admin 用户访问 /admin → 加载成功，Users 入口存在
 *   3. super_admin 用户访问 /admin → 看得到 Roles 子 tab；普通 admin 看不到
 */
import { test, expect } from '@playwright/test'

const FAB_NS = 'fab.pc'

const okJson = (data = {}) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 200, data }),
})

async function setupAuth(context, roles) {
  await context.addInitScript(
    ([ns, r]) => {
      localStorage.setItem(`${ns}.token`, 'e2e-token')
      localStorage.setItem(
        `${ns}.user`,
        JSON.stringify({ userId: 99, nickname: 'opsAdmin', roles: r }),
      )
      localStorage.setItem(`${ns}.expireAt`, String(Date.now() + 3600_000))
    },
    [FAB_NS, roles],
  )
}

async function stubAdminEndpoints(context) {
  // dashboard
  await context.route('**/admin/dashboard', (route) =>
    route.fulfill(okJson({ userCount: 0, postCount: 0, orderCount: 0 })),
  )
  // users list (空)
  await context.route('**/admin/users**', (route) => {
    if (route.request().method() === 'GET' && route.request().url().includes('/admin/users')) {
      return route.fulfill(okJson({ rows: [], total: 0, page: 1, size: 20 }))
    }
    return route.fulfill(okJson({}))
  })
  // audit
  await context.route('**/admin/audit/login-events**', (route) =>
    route.fulfill(okJson({ rows: [], total: 0, page: 1, size: 20 })),
  )
}

test.describe('PC user-auth P4 — Admin RBAC', () => {
  test('non-admin (user) 访问 /admin → 跳 /home', async ({ page, context }) => {
    await setupAuth(context, ['user'])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })

  test('admin 用户访问 /admin → 加载成功（不重定向）', async ({ page, context }) => {
    await setupAuth(context, ['admin'])
    await stubAdminEndpoints(context)
    await page.goto('/admin')
    // URL 保留 /admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 5_000 })
    // 主区已挂载
    await expect(page.locator('[data-test="admin-main"]')).toBeVisible({ timeout: 5_000 })
  })

  test('super_admin 看得到 Roles 子 tab；普通 admin 看不到', async ({ page, context, browser }) => {
    // super_admin 视图
    await setupAuth(context, ['super_admin'])
    await stubAdminEndpoints(context)
    await page.goto('/admin')
    await expect(page.locator('[data-test="admin-main"]')).toBeVisible()
    // 'Roles' 子 tab 文本（fixture label）
    await expect(page.getByText('Roles')).toBeVisible({ timeout: 5_000 })

    // 普通 admin 视图：新建 context 干净环境，避免 storage 残留
    const ctx2 = await browser.newContext()
    await setupAuth(ctx2, ['admin'])
    await stubAdminEndpoints(ctx2)
    const page2 = await ctx2.newPage()
    await page2.goto('/admin')
    await expect(page2.locator('[data-test="admin-main"]')).toBeVisible()
    // 不应看到 Roles 子 tab
    await expect(page2.getByText('Roles')).toHaveCount(0)
    await ctx2.close()
  })
})
