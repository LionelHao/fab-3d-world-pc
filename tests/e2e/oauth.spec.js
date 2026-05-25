/**
 * E2E — PC OAuth 登录 / 绑定流程 mock (user-auth P5)
 *
 * Spec: docs/user-auth-impl.md §5 + 总体方案 §5.3 + §11 P5
 *
 * Cases:
 *   1. Login 页 OAuth 按钮存在 + 点击触发 GET /auth/oauth/google/authorize（mock 回 authorizeUrl）
 *   2. 模拟 provider 回调：直接导航到 /oauth/callback/google?code=...&state=... → POST /callback → /home
 *   3. SettingsSecurity 内已绑定 GitHub → 显示 Unbind 按钮 → 点击 → DELETE /auth/oauth/github → 成功 toast
 */
import { test, expect } from '@playwright/test'

const FAB_NS = 'fab.pc'

function mockJson(data = {}, code = 200) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code, data }),
  }
}

test.describe('PC user-auth P5 — OAuth mock flow', () => {
  test('Login 页 OAuth 按钮存在并触发 authorize 请求', async ({ page, context }) => {
    await context.route('**/auth/oauth/google/authorize**', (route) =>
      route.fulfill(mockJson({ authorizeUrl: 'http://localhost:8090/oauth-stub', state: 'st-1' })),
    )
    // 占位 stub 页（避免真实跳 Google）— Playwright 拦截到 /oauth-stub 后返回空白 200
    await context.route('**/oauth-stub**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>stub</body></html>' }),
    )

    await page.goto('/login')
    const googleBtn = page.locator('[data-test="oauth-btn-google"]')
    await expect(googleBtn).toBeVisible()
    const reqPromise = page.waitForRequest(/\/auth\/oauth\/google\/authorize/)
    await googleBtn.click()
    const req = await reqPromise
    expect(req.url()).toContain('/auth/oauth/google/authorize')
  })

  test('/oauth/callback/google?code=...&state=... mock → 写入 store → 跳 /home', async ({ page, context }) => {
    await context.route('**/auth/oauth/google/callback', (route) =>
      route.fulfill(
        mockJson({
          token: 'e2e-oauth-tok',
          expireAt: Date.now() + 3600_000,
          user: { userId: 7, nickname: 'oauth-user', roles: ['user'] },
          isNewUser: false,
        }),
      ),
    )
    await context.route('**/user/info', (route) =>
      route.fulfill(mockJson({ userId: 7, nickname: 'oauth-user', roles: ['user'] })),
    )

    await page.goto('/oauth/callback/google?code=mock-code&state=mock-state')
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })

  test('SettingsSecurity 已绑定 GitHub → 解绑 happy path', async ({ page, context }) => {
    await context.addInitScript(
      ([ns]) => {
        localStorage.setItem(`${ns}.token`, 'e2e-token')
        localStorage.setItem(
          `${ns}.user`,
          JSON.stringify({
            userId: 1,
            nickname: 'lionel',
            roles: ['user'],
            bindings: [{ provider: 'github', boundAt: '2026-05-01T00:00:00Z' }],
          }),
        )
        localStorage.setItem(`${ns}.expireAt`, String(Date.now() + 3600_000))
      },
      [FAB_NS],
    )
    await context.route('**/auth/sessions', (route) => route.fulfill(mockJson([])))
    await context.route('**/auth/oauth/github', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill(mockJson(null))
      }
      return route.fallback()
    })

    await page.goto('/settings/security')
    const unbindBtn = page.locator('[data-test="oauth-unbind-github"]')
    await expect(unbindBtn).toBeVisible()
    const reqPromise = page.waitForRequest(
      (r) => r.url().includes('/auth/oauth/github') && r.method() === 'DELETE',
    )
    await unbindBtn.click()
    const req = await reqPromise
    expect(req.method()).toBe('DELETE')
  })
})
