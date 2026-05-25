/**
 * E2E — PC Login captcha required (user-auth P6)
 *
 * Spec: docs/user-auth-impl.md §11 P6
 *
 * Case: /captcha/config 返 required:true → Login 渲染 CaptchaWidget mock → 通过后正常登录
 */
import { test, expect } from '@playwright/test'

function mockJson(data = {}, code = 200) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code, data }),
  }
}

test.describe('PC user-auth P6 — CAPTCHA required mock', () => {
  test('captcha config required=true → 渲染 widget → 勾选后允许登录', async ({ page, context }) => {
    await context.route('**/captcha/config**', (route) =>
      route.fulfill(mockJson({ provider: 'mock', siteKey: '', required: true })),
    )
    await context.route('**/auth/login/password', (route) =>
      route.fulfill(
        mockJson({
          token: 'cap-tk',
          expireAt: Date.now() + 3600_000,
          user: { userId: 1, nickname: 'lionel', roles: ['user'] },
        }),
      ),
    )
    await context.route('**/user/info', (route) =>
      route.fulfill(mockJson({ userId: 1, nickname: 'lionel', roles: ['user'] })),
    )

    await page.goto('/login')
    const widget = page.locator('[data-test="captcha-widget"]')
    await expect(widget).toBeVisible({ timeout: 5_000 })
    // 勾选 mock checkbox
    await page.locator('[data-test="captcha-mock-checkbox"]').check()
    // 填账号密码
    const inputs = page.locator('.pc-login__card input')
    await inputs.nth(0).fill('lionel')
    await inputs.nth(1).fill('p@ss-1234')
    // 监听 login 请求并断言 captchaToken
    const reqPromise = page.waitForRequest('**/auth/login/password')
    await page.getByRole('button', { name: /Sign In|登录/ }).first().click()
    const req = await reqPromise
    const body = JSON.parse(req.postData() || '{}')
    expect(body.captchaToken).toBe('mock-pass')
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })
})
