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
const oauthAuthorizeMock = vi.fn()
const oauthUnbindMock = vi.fn()

vi.mock('@/service/auth', () => ({
  listSessions: (...a) => listSessionsMock(...a),
  revokeSession: (...a) => revokeSessionMock(...a),
  revokeOtherSessions: (...a) => revokeOtherSessionsMock(...a),
  changePassword: (...a) => changePasswordMock(...a),
  logout: (...a) => logoutMock(...a),
  oauthAuthorize: (...a) => oauthAuthorizeMock(...a),
  oauthUnbind: (...a) => oauthUnbindMock(...a),
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
  const auth = (await import('@/locales/en-US/auth.json')).default
  return { settings, common, auth }
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
    revokeSessionMock.mockReset()
    revokeOtherSessionsMock.mockReset()
    changePasswordMock.mockReset()
    logoutMock.mockReset()
    oauthAuthorizeMock.mockReset()
    oauthUnbindMock.mockReset()
    revokeSessionMock.mockResolvedValue({})
    revokeOtherSessionsMock.mockResolvedValue({})
    changePasswordMock.mockResolvedValue({})
    logoutMock.mockResolvedValue({})
  })

  it('mount 后调 listSessions 并渲染 2 行', async () => {
    const { w } = await mountView()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)
    // 仅看 PcSessionList 的 tbody（不含 OAuth 表）
    expect(w.findAll('.pc-session-list__table tbody tr').length).toBe(2)
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

  /* ───────── OAuth 绑定区（P5） ───────── */

  function presetUser(bindings = []) {
    localStorage.setItem('fab.pc.token', 'tk')
    localStorage.setItem('fab.pc.user', JSON.stringify({ userId: 1, roles: ['user'], bindings }))
    localStorage.setItem('fab.pc.expireAt', String(Date.now() + 3600_000))
  }

  it('OAuth 区块渲染三 provider 行（google/github/apple）', async () => {
    presetUser()
    const { w } = await mountView()
    expect(w.find('[data-test="oauth-row-google"]').exists()).toBe(true)
    expect(w.find('[data-test="oauth-row-github"]').exists()).toBe(true)
    expect(w.find('[data-test="oauth-row-apple"]').exists()).toBe(true)
  })

  it('未绑定 provider → 显示「Bind」按钮', async () => {
    presetUser([])
    const { w } = await mountView()
    expect(w.find('[data-test="oauth-bind-google"]').exists()).toBe(true)
    expect(w.find('[data-test="oauth-unbind-google"]').exists()).toBe(false)
  })

  it('已绑定 provider → 显示「Unbind」按钮', async () => {
    presetUser([{ provider: 'github', boundAt: '2026-05-01T00:00:00Z' }])
    const { w } = await mountView()
    expect(w.find('[data-test="oauth-unbind-github"]').exists()).toBe(true)
    expect(w.find('[data-test="oauth-bind-github"]').exists()).toBe(false)
  })

  it('点 Bind → 调 oauthAuthorize 并跳转到 authorizeUrl（action=bind 拼到 redirectUri）', async () => {
    presetUser()
    oauthAuthorizeMock.mockResolvedValueOnce({
      authorizeUrl: 'https://accounts.google.com/...',
      state: 'st',
    })
    const originalLocation = window.location
    delete window.location
    window.location = { origin: 'http://localhost', href: '' }
    const { w } = await mountView()
    await w.find('[data-test="oauth-bind-google"]').trigger('click')
    await flushPromises()
    expect(oauthAuthorizeMock).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({
        redirectUri: expect.stringContaining('action=bind'),
      }),
    )
    expect(window.location.href).toBe('https://accounts.google.com/...')
    window.location = originalLocation
  })

  it('点 Unbind happy → 调 oauthUnbind + 成功 toast + bindings 清掉该 provider', async () => {
    presetUser([{ provider: 'github', boundAt: '2026-05-01T00:00:00Z' }])
    oauthUnbindMock.mockResolvedValueOnce(null)
    const { w } = await mountView()
    // ElPopconfirm 包装的解绑按钮，data-test 在内层 button
    await w.find('[data-test="oauth-unbind-github"]').trigger('click')
    await flushPromises()
    expect(oauthUnbindMock).toHaveBeenCalledWith('github')
    expect(elMessageSuccess).toHaveBeenCalled()
  })

  it('解绑失败 → 不抛出（拦截器已 toast）', async () => {
    presetUser([{ provider: 'github', boundAt: '2026-05-01T00:00:00Z' }])
    oauthUnbindMock.mockRejectedValueOnce({ code: 422, message: 'fail' })
    const { w } = await mountView()
    await w.find('[data-test="oauth-unbind-github"]').trigger('click')
    await flushPromises()
    expect(oauthUnbindMock).toHaveBeenCalled()
  })
})
