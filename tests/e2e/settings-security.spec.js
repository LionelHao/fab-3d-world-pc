/**
 * E2E — PC SettingsSecurity 设备列表 + 修改密码 (user-auth P3)
 *
 * Spec: docs/user-auth-impl.md §4 + 总体 §11 P3 + §10.6
 *
 * Cases:
 *   1. 预登录后访问 /settings/security → 渲染设备列表（含 Current chip）
 *   2. 点 "Revoke" 按钮（非当前会话）→ 调 /auth/sessions/{tokenValue}/revoke
 *   3. 点 "修改密码" 按钮 → 弹 ElDialog
 */
import { test, expect } from '@playwright/test'

const FAB_NS = 'fab.pc'

const okJson = (data = {}) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 200, data }),
})

const SAMPLE_SESSIONS = [
  {
    tokenValue: 'cur-tok',
    deviceType: 'pc',
    ip: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (PC)',
    loginAt: '2026-05-25T09:00:00Z',
    current: true,
  },
  {
    tokenValue: 'web-tok',
    deviceType: 'web',
    ip: '20.0.0.2',
    userAgent: 'Mozilla/5.0 (Web)',
    loginAt: '2026-05-25T10:00:00Z',
    current: false,
  },
]

test.describe('PC user-auth P3 — settings/security', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(
      ([ns]) => {
        localStorage.setItem(`${ns}.token`, 'e2e-token')
        localStorage.setItem(
          `${ns}.user`,
          JSON.stringify({ userId: 1, nickname: 'lionel', roles: ['user'] }),
        )
        localStorage.setItem(`${ns}.expireAt`, String(Date.now() + 3600_000))
      },
      [FAB_NS],
    )
  })

  test('预登录后 /settings/security 渲染设备列表 + Current chip', async ({ page, context }) => {
    await context.route('**/auth/sessions', (route) =>
      route.fulfill(okJson(SAMPLE_SESSIONS)),
    )

    await page.goto('/settings/security')

    // 设备表头存在
    await expect(page.locator('thead th').first()).toBeVisible({ timeout: 5_000 })
    // 行数（2 行）
    await expect(page.locator('.pc-session-list__table tbody tr')).toHaveCount(2)
    // 第二行（非当前）revoke 按钮可点
    const revokeBtn = page.locator('[data-testid="revoke-btn-web-tok"]')
    await expect(revokeBtn).toBeVisible()
    await expect(revokeBtn).toBeEnabled()
    // 第一行（当前）revoke 按钮 disabled
    const curBtn = page.locator('[data-testid="revoke-btn-cur-tok"]')
    await expect(curBtn).toBeDisabled()
    // Current chip 渲染（locale-agnostic：chip 在当前行内存在 .pc-session-list__chip）
    await expect(
      page.locator('.pc-session-list__table tbody tr').first().locator('.pc-session-list__chip'),
    ).toBeVisible()
  })

  test('点 Revoke (非当前) → 调 /auth/sessions/{tokenValue}/revoke + 刷新', async ({ page, context }) => {
    let revokeCalled = 0
    let sessionsCalls = 0
    await context.route('**/auth/sessions', (route) => {
      sessionsCalls += 1
      // 第一次返回 2 个；第二次刷新返回剩 1 个
      const data = sessionsCalls === 1 ? SAMPLE_SESSIONS : [SAMPLE_SESSIONS[0]]
      return route.fulfill(okJson(data))
    })
    await context.route('**/auth/sessions/web-tok/revoke', (route) => {
      revokeCalled += 1
      return route.fulfill(okJson())
    })

    await page.goto('/settings/security')
    await page.locator('[data-testid="revoke-btn-web-tok"]').click()

    await expect.poll(() => revokeCalled).toBe(1)
    // 刷新后只剩 1 行
    await expect(page.locator('.pc-session-list__table tbody tr')).toHaveCount(1, { timeout: 5_000 })
  })

  test('点 "修改密码" 按钮 → ElDialog 弹出', async ({ page, context }) => {
    await context.route('**/auth/sessions', (route) => route.fulfill(okJson(SAMPLE_SESSIONS)))

    await page.goto('/settings/security')
    await page.locator('[data-test="ss-pw-open"]').click()
    // ElDialog inner content 出现
    await expect(page.locator('[data-test="ss-pw-dialog"]')).toBeVisible({ timeout: 5_000 })
    // 3 个密码输入框
    await expect(page.locator('.el-dialog input[type="password"]')).toHaveCount(3)
  })
})
