/**
 * AdminUserDetailDrawer — 用户详情抽屉（P4）
 *
 * 行为契约：
 *   - props: open(v-model) / user / loading
 *   - open=true + user 不空 → 渲染基本信息（userId / createTime / lastLogin / activeSessions）
 *   - user.events 非空 → 渲染 events 列表
 *   - user.events 空 → 渲染 noEvents 占位
 *   - loading=true → 渲染 loading 占位
 *   - close → emit update:open false
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
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

async function mountDrawer(propsOverride = {}) {
  const i18n = await loadI18n()
  const C = (await import('./AdminUserDetailDrawer.vue')).default
  const w = mount(C, {
    props: {
      open: true,
      loading: false,
      user: {
        userId: 7,
        username: 'lionel',
        createTime: '2026-01-01T00:00:00Z',
        lastLogin: '2026-05-20T10:00:00Z',
        activeSessions: 3,
        events: [
          { createdAt: '2026-05-25T10:00:00Z', eventType: 'LOGIN_SUCCESS', ip: '1.1.1.1', deviceType: 'pc' },
          { createdAt: '2026-05-24T10:00:00Z', eventType: 'LOGIN_FAIL', ip: '2.2.2.2', deviceType: 'web', failReason: 'BAD_PW' },
        ],
      },
      ...propsOverride,
    },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  await new Promise((r) => setTimeout(r, 0))
  lastW = w
  return w
}

describe('AdminUserDetailDrawer (P4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (lastW) { lastW.unmount(); lastW = null }
    document.body.innerHTML = ''
  })

  it('open=true → 渲染 user 基本信息 + events 列表', async () => {
    await mountDrawer()
    const text = document.body.textContent
    expect(text).toContain('lionel')
    expect(text).toContain('LOGIN_SUCCESS')
    expect(text).toContain('LOGIN_FAIL')
    expect(text).toContain('3') // activeSessions
  })

  it('events 空时显示 noEvents 占位', async () => {
    await mountDrawer({
      user: { userId: 7, username: 'l', events: [] },
    })
    const text = document.body.textContent
    expect(text).toContain('暂无事件')
  })

  it('loading=true 时显示加载占位', async () => {
    await mountDrawer({ loading: true })
    const text = document.body.textContent
    expect(text).toContain('加载中')
  })

  it('点关闭 → emit update:open false', async () => {
    const w = await mountDrawer()
    const closeBtn = document.querySelector('[data-test="adm-detail-close"]')
    expect(closeBtn).not.toBeNull()
    closeBtn.click()
    await flushPromises()
    expect(w.emitted('update:open')[0][0]).toBe(false)
  })
})
