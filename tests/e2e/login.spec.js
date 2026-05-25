/**
 * E2E — PC login + auth gating (user-auth P1 golden path)
 *
 * Spec: docs/user-auth-impl.md §7.3
 *
 * Cases:
 *   1. password login → /home
 *   2. expired token visiting /profile → redirected to /login
 *   3. non-admin user visiting /admin → redirected to /home (requiresRoles gate)
 */
import { test, expect } from '@playwright/test'

const FAB_NS = 'fab.pc'

test.describe('PC user-auth P1 — golden paths', () => {
  test('password login → /home', async ({ page, context }) => {
    // 拦截 POST /auth/login/password 返回 mock 成功
    await context.route('**/auth/login/password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            token: 'e2e-tok',
            expireAt: Date.now() + 3600_000,
            user: { userId: 1, nickname: 'lionel', roles: ['user'] },
          },
        }),
      }),
    )
    // /user/info 兜底（onLogin 之后会调）
    await context.route('**/user/info', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { userId: 1, nickname: 'lionel', roles: ['user'] },
        }),
      }),
    )

    await page.goto('/login')
    // identifier + password
    const identifierInput = page.locator('input').first()
    const passwordInput = page.locator('input[type="password"]')
    await identifierInput.fill('lionel')
    await passwordInput.fill('password123')
    // 点击登录按钮
    await page.getByRole('button', { name: /sign in|登录/i }).first().click()

    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })

  test('expired token visiting /profile → redirected to /login', async ({ page, context }) => {
    await context.addInitScript((ns) => {
      localStorage.setItem(`${ns}.token`, 'expired-tok')
      localStorage.setItem(
        `${ns}.user`,
        JSON.stringify({ userId: 1, roles: ['user'] }),
      )
      // expireAt 在过去 → isLoggedIn === false
      localStorage.setItem(`${ns}.expireAt`, String(Date.now() - 1000))
    }, FAB_NS)
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('non-admin user visiting /admin → redirected to /home', async ({ page, context }) => {
    await context.addInitScript((ns) => {
      localStorage.setItem(`${ns}.token`, 'valid-tok')
      localStorage.setItem(
        `${ns}.user`,
        JSON.stringify({ userId: 1, roles: ['user'] }),
      )
      localStorage.setItem(`${ns}.expireAt`, String(Date.now() + 3600_000))
    }, FAB_NS)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })
})
