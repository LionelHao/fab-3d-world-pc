/**
 * SettingsSecurity (PC) — view 单测（user-auth P3）
 *
 * 行为契约：
 *   - mount 后调 listSessions，渲染会话列表（PcSessionList）
 *   - listSessions reject → sessions=[]（拦截器兜底，UI 不崩）
 *   - 点 Revoke → 调 revokeSession(token) → success toast + 刷新列表
 *   - 点 Revoke Others → ElPopconfirm 包装的按钮存在 → 调 revokeOtherSessions
 *   - 点 "修改密码" 按钮 → ElDialog 打开
 *   - submit 密码：缺旧密码 → 表单 helper 提示，不调 changePassword
 *   - submit 密码：新密码 != 确认 → 提示不一致
 *   - submit 密码：全部 valid → 调 changePassword → success toast + logout + push('/login')
 *
 * Mock：service/auth 全部接口；@/router push 桩
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'

const listSessionsMock = vi.fn()
const revokeSessionMock = vi.fn()
const revokeOtherSessionsMock = vi.fn()
const changePasswordMock = vi.fn()
const logoutMock = vi.fn()

vi.mock('@/service/auth', () => ({
  listSessions: (...a) => listSessionsMock(...a),
  revokeSession: (...a) => revokeSessionMock(...a),
  revokeOtherSessions: (...a) => revokeOtherSessionsMock(...a),
  changePassword: (...a) => changePasswordMock(...a),
  logout: (...a) => logoutMock(...a),
}))

// Spy router.push via vue-router useRouter mock（vue-router 内部 push 不可枚举可写）
const routerPushMock = vi.fn(() => Promise.resolve())
vi.mock('vue-router', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useRouter: () => ({
      push: routerPushMock,
      back: vi.fn(),
      replace: vi.fn(),
      currentRoute: { value: { fullPath: '/settings/security', path: '/settings/security', query: {} } },
    }),
  }
})

const elMessageSuccess = vi.fn()
const elMessageError = vi.fn()
const elMessageWarning = vi.fn()
const elMessageInfo = vi.fn()

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: {
      success: elMessageSuccess,
      error: elMessageError,
      warning: elMessageWarning,
      info: elMessageInfo,
    },
  }
})

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: { 'en-US': await loadMessages() },
})

async function loadMessages() {
  const settings = (await import('@/locales/en-US/settings.json')).default
  const common = (await import('@/locales/en-US/common.json')).default
  return { settings, common }
}

function makeRouter() {
  const r = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/home', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
      { path: '/profile', component: { template: '<div/>' } },
      { path: '/settings/security', component: { template: '<div/>' } },
    ],
  })
  return r
}

async function mountView() {
  setActivePinia(createPinia())
  const router = makeRouter()
  router.push('/settings/security')
  await router.isReady()
  const SettingsSecurity = (await import('./SettingsSecurity.vue')).default
  const w = mount(SettingsSecurity, {
    attachTo: document.body,
    global: {
      plugins: [i18n, router],
      stubs: {
        // stub out chrome / footer for testing clarity
        PcNavbar: true,
        PcFooter: true,
      },
    },
  })
  await flushPromises()
  return { w, router, push: routerPushMock }
}

describe('SettingsSecurity (PC, P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSessionsMock.mockReset()
    revokeSessionMock.mockReset()
    revokeOtherSessionsMock.mockReset()
    changePasswordMock.mockReset()
    logoutMock.mockReset()
    routerPushMock.mockReset()
    routerPushMock.mockImplementation(() => Promise.resolve())
    listSessionsMock.mockResolvedValue([
      { tokenValue: 'cur', deviceType: 'pc', ip: '1.1.1.1', userAgent: 'UA', loginAt: '2026-05-25T10:00:00Z', current: true },
      { tokenValue: 'other', deviceType: 'web', ip: '2.2.2.2', userAgent: 'UA2', loginAt: '2026-05-25T11:00:00Z', current: false },
    ])
    revokeSessionMock.mockResolvedValue({})
    revokeOtherSessionsMock.mockResolvedValue({})
    changePasswordMock.mockResolvedValue({})
    logoutMock.mockResolvedValue({})
  })

  it('mount 后调 listSessions 并渲染 2 行', async () => {
    const { w } = await mountView()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)
    expect(w.findAll('tbody tr').length).toBe(2)
  })

  it('listSessions reject 时不崩，sessions=[]', async () => {
    listSessionsMock.mockRejectedValueOnce(new Error('network'))
    const { w } = await mountView()
    expect(w.text()).toContain('No other active devices')
  })

  it('点 PcSessionList revoke 按钮 → 调 revokeSession + 刷新', async () => {
    const { w } = await mountView()
    listSessionsMock.mockClear()
    await w.find('[data-testid="revoke-btn-other"]').trigger('click')
    await flushPromises()
    expect(revokeSessionMock).toHaveBeenCalledWith('other')
    expect(elMessageSuccess).toHaveBeenCalled()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)
  })

  it('点 revoke-others 按钮 → 调 revokeOtherSessions', async () => {
    const { w } = await mountView()
    await w.find('[data-testid="revoke-others-btn"]').trigger('click')
    await flushPromises()
    expect(revokeOtherSessionsMock).toHaveBeenCalled()
  })

  it('点 "修改密码" 按钮 → ElDialog 打开 (data-test ss-pw-dialog 出现)', async () => {
    const { w } = await mountView()
    await w.find('[data-test="ss-pw-open"]').trigger('click')
    await flushPromises()
    expect(document.querySelector('[data-test="ss-pw-dialog"]')).not.toBeNull()
  })

  it('submit 密码：缺旧密码 → 不调 changePassword', async () => {
    const { w } = await mountView()
    await w.find('[data-test="ss-pw-open"]').trigger('click')
    await flushPromises()
    document.querySelector('[data-test="ss-pw-submit"]').click()
    await flushPromises()
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  async function fillPwForm(values) {
    // ElDialog 异步 mount，等下一 tick 再查 input
    await new Promise((r) => setTimeout(r, 0))
    const inputs = document.querySelectorAll('.el-dialog input[type="password"]')
    expect(inputs.length).toBeGreaterThanOrEqual(3)
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input')) }
    set(inputs[0], values.old)
    set(inputs[1], values.next)
    set(inputs[2], values.confirm)
    await flushPromises()
  }

  it('submit 密码：新密码 != 确认 → 不调 changePassword', async () => {
    const { w } = await mountView()
    await w.find('[data-test="ss-pw-open"]').trigger('click')
    await flushPromises()
    await fillPwForm({ old: 'old-Pass1', next: 'new-Pass1234', confirm: 'mismatched9' })
    document.querySelector('[data-test="ss-pw-submit"]').click()
    await flushPromises()
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('submit 密码 happy → changePassword + logout + push /login', async () => {
    const { w, push } = await mountView()
    await w.find('[data-test="ss-pw-open"]').trigger('click')
    await flushPromises()
    await fillPwForm({ old: 'old-Pass1', next: 'new-Pass1234', confirm: 'new-Pass1234' })
    document.querySelector('[data-test="ss-pw-submit"]').click()
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    await flushPromises()
    expect(changePasswordMock).toHaveBeenCalledWith({ oldPassword: 'old-Pass1', newPassword: 'new-Pass1234' })
    expect(elMessageSuccess).toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/login')
  })
})
