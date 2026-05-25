/**
 * E2E — PC MFA setup + 登录二段 mock 流程 (user-auth P6)
 *
 * Spec: docs/user-auth-impl.md §11 P6
 *
 * Cases:
 *   1. SettingsSecurity 内开启 MFA：mock /mfa/setup + /mfa/verify-setup → 看 QR / secret / recovery codes
 *   2. 登录密码后端返回 requireMfa → 切到 MFA step → mock /auth/login/mfa-verify → 跳 /home
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

test.describe('PC user-auth P6 — MFA mock flow', () => {
  test('SettingsSecurity 开启 MFA 全链路：QR → verify → 10 个恢复码', async ({ page, context }) => {
    await context.addInitScript(
      ([ns]) => {
        localStorage.setItem(`${ns}.token`, 'e2e-token')
        localStorage.setItem(
          `${ns}.user`,
          JSON.stringify({ userId: 1, nickname: 'lionel', roles: ['user'], bindings: [] }),
        )
        localStorage.setItem(`${ns}.expireAt`, String(Date.now() + 3600_000))
      },
      [FAB_NS],
    )
    await context.route('**/auth/sessions', (route) => route.fulfill(mockJson([])))
    await context.route('**/mfa/status', (route) =>
      route.fulfill(mockJson({ enabled: false, recoveryRemaining: 0 })),
    )
    await context.route('**/user/security/alerts**', (route) => route.fulfill(mockJson([])))
    await context.route('**/mfa/setup', (route) =>
      route.fulfill(
        mockJson({
          secret: 'JBSWY3DPEHPK3PXP',
          qrUrl: 'otpauth://totp/Fab:lionel?secret=JBSWY3DPEHPK3PXP&issuer=Fab',
        }),
      ),
    )
    await context.route('**/mfa/verify-setup', (route) =>
      route.fulfill(
        mockJson({
          recoveryCodes: Array.from({ length: 10 }, (_, i) => `code-${i}`),
        }),
      ),
    )

    await page.goto('/settings/security')
    const enableBtn = page.locator('[data-test="mfa-enable-btn"]')
    await expect(enableBtn).toBeVisible({ timeout: 5_000 })
    await enableBtn.click()
    await expect(page.locator('[data-test="mfa-setup-dialog"]')).toBeVisible()
    // QR / secret 渲染
    await expect(page.locator('[data-test="mfa-setup-secret"]')).toContainText('JBSWY3DPEHPK3PXP')
    // 输入 6 位 code → next
    await page.locator('[data-test="mfa-setup-code"]').fill('123456')
    await page.locator('[data-test="mfa-setup-verify"]').click()
    // recovery codes 渲染
    await expect(page.locator('[data-test="mfa-setup-codes"]')).toContainText('code-0')
    await expect(page.locator('[data-test="mfa-setup-codes"]')).toContainText('code-9')
  })

  test('登录密码 → 后端 requireMfa → 二段输入 → /auth/login/mfa-verify → /home', async ({ page, context }) => {
    await context.route('**/auth/login/password', (route) =>
      route.fulfill(mockJson({ requireMfa: true, mfaToken: 'mfa-tok' })),
    )
    await context.route('**/auth/login/mfa-verify', (route) =>
      route.fulfill(
        mockJson({
          token: 'final-tk',
          expireAt: Date.now() + 3600_000,
          user: { userId: 1, nickname: 'lionel', roles: ['user'] },
        }),
      ),
    )
    await context.route('**/user/info', (route) =>
      route.fulfill(mockJson({ userId: 1, nickname: 'lionel', roles: ['user'] })),
    )
    await context.route('**/captcha/config**', (route) =>
      route.fulfill(mockJson({ provider: 'mock', siteKey: '', required: false })),
    )

    await page.goto('/login')
    // 填账号密码（PC Login 用 UiInput / UiFormField，input[type] 不是 password；用 nth）
    const inputs = page.locator('.pc-login__card input')
    await inputs.nth(0).fill('lionel')
    await inputs.nth(1).fill('p@ss-1234')
    // 点 Sign In（Sign In 按钮含 Auth badge）
    await page.getByRole('button', { name: /Sign In|登录/ }).first().click()
    // 应切到 MFA step
    await expect(page.locator('[data-test="login-mfa-code"]')).toBeVisible({ timeout: 5_000 })
    await page.locator('[data-test="login-mfa-code"]').fill('654321')
    await page.locator('[data-test="login-mfa-submit"]').click()
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 })
  })
})
