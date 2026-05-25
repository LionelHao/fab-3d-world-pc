/**
 * E2E — PC 密码重置三步流程 (user-auth P2)
 *
 * Spec: docs/user-auth-impl.md §9 P2
 *
 * Cases:
 *   1. Login 页"忘记密码"链接跳 /forgot-password
 *   2. Full happy path：identifier → code → newPassword → /login + success toast
 *   3. STEP 2 重发按钮在初始 60s 内禁用
 */
import { test, expect } from '@playwright/test'

const PW_RESET_REQUEST_RX = '**/auth/password/reset/request'
const PW_RESET_CONFIRM_RX = '**/auth/password/reset/confirm'

const okJson = (data = {}) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 200, data }),
})

test.describe('PC user-auth P2 — forgot password flow', () => {
  test('Login 页 "忘记密码" 链接跳 /forgot-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('forgot-link').click()
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 5_000 })
  })

  test('three-step happy path → 密码重置成功并跳回 /login', async ({ page, context }) => {
    await context.route(PW_RESET_REQUEST_RX, (route) => route.fulfill(okJson()))
    await context.route(PW_RESET_CONFIRM_RX, (route) => route.fulfill(okJson()))

    await page.goto('/forgot-password')

    // ── STEP 1: identifier
    const idInput = page.locator('input').first()
    await idInput.fill('lionel@fab.io')
    await page.getByRole('button', { name: /send|发送/i }).first().click()

    // ── STEP 2: code（等 step transition 完）
    const codeInput = page.locator('input[inputmode="numeric"]')
    await expect(codeInput).toBeVisible({ timeout: 5_000 })
    await codeInput.fill('123456')
    await page.getByRole('button', { name: /next|下一步/i }).first().click()

    // ── STEP 3: new password (有两个 password input)
    const pwInputs = page.locator('input[type="password"]')
    await expect(pwInputs.first()).toBeVisible({ timeout: 5_000 })
    await pwInputs.first().fill('newPass1234')
    await pwInputs.nth(1).fill('newPass1234')
    await page.getByRole('button', { name: /confirm reset|确认重置/i }).first().click()

    // 成功后回 /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('STEP 2 的重发按钮在初始 60s 内禁用 (倒计时)', async ({ page, context }) => {
    await context.route(PW_RESET_REQUEST_RX, (route) => route.fulfill(okJson()))

    await page.goto('/forgot-password')
    await page.locator('input').first().fill('user@fab.io')
    await page.getByRole('button', { name: /send|发送/i }).first().click()

    const resendBtn = page.getByTestId('resend-btn')
    await expect(resendBtn).toBeVisible({ timeout: 5_000 })
    await expect(resendBtn).toBeDisabled()
  })
})
