import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'

// Element Plus mocks: ElMessage / ElConfigProvider not needed in node env
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// router mock (avoid bootstrapping full router in unit tests)
const pushMock = vi.fn()
vi.mock('@/router', () => ({
  default: {
    push: pushMock,
    currentRoute: { value: { fullPath: '/profile' } },
  },
}))

// i18n mock (return key for assertion simplicity)
vi.mock('@/i18n', () => ({
  t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
}))

/**
 * utils/axios — PC axios 拦截器 (user-auth P1)
 *
 * 验证：
 * - request: Bearer token from store / X-Device-Type: pc
 * - response: code === 200 直接 unwrap data
 * - response: /auth/login/password 自动 store.login
 * - response: code === 419 / 401 → store.logout + router.push('/login', { query.from })
 * - request: refresh 阈值触发 (expireAt - now < 15min)
 * - request: 并发 refresh 去重 (单一 in-flight refresh promise)
 * - request: 排除 /auth/refresh / /auth/login/* / /auth/signup 自身递归
 */
describe('utils/axios — PC 拦截器 (P1)', () => {
  let axios
  let useUserStore
  let mock
  let ElMessage

  beforeEach(async () => {
    localStorage.clear()
    pushMock.mockReset()
    vi.resetModules()

    // 重新 import 模块以确保 mock 生效
    const epMod = await import('element-plus')
    ElMessage = epMod.ElMessage
    Object.values(ElMessage).forEach((fn) => fn.mockReset && fn.mockReset())

    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())

    const storeMod = await import('@/stores/user')
    useUserStore = storeMod.useUserStore

    const axiosMod = await import('@/utils/axios')
    axios = axiosMod.default
    mock = new MockAdapter(axios)
  })

  afterEach(() => {
    mock.restore()
  })

  it('attaches Bearer token + X-Device-Type: pc to outgoing requests', async () => {
    useUserStore().login('abc-tok', { userId: 1, roles: ['user'] }, Date.now() + 3600_000)
    mock.onGet('/user/info').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer abc-tok')
      expect(config.headers['X-Device-Type']).toBe('pc')
      return [200, { code: 200, data: { userId: 1 } }]
    })
    const data = await axios.get('/user/info')
    expect(data.userId).toBe(1)
  })

  it('unwraps response data on code 200', async () => {
    mock.onGet('/foo').reply(200, { code: 200, data: { x: 42 } })
    const data = await axios.get('/foo')
    expect(data).toEqual({ x: 42 })
  })

  it('auto-store.login on /auth/login/password success response', async () => {
    const exp = Date.now() + 7200_000
    mock.onPost('/auth/login/password').reply(200, {
      code: 200,
      data: { token: 'new-tok', expireAt: exp, user: { userId: 9, roles: ['user'] } },
    })
    await axios.post('/auth/login/password', { identifier: 'l', password: 'p' })
    const store = useUserStore()
    expect(store.token).toBe('new-tok')
    expect(store.user.userId).toBe(9)
    expect(store.expireAt).toBe(exp)
  })

  it('auto-store.login on /auth/signup success response', async () => {
    const exp = Date.now() + 7200_000
    mock.onPost('/auth/signup').reply(200, {
      code: 200,
      data: { token: 'sx', expireAt: exp, user: { userId: 1, roles: ['user'] } },
    })
    await axios.post('/auth/signup', {})
    expect(useUserStore().token).toBe('sx')
  })

  it('on code 419 → store.logout + router.push /login?from=...', async () => {
    useUserStore().login('expired', { userId: 1 }, Date.now() + 3600_000)
    mock.onGet('/user/info').reply(200, { code: 419, message: 'TOKEN_EXPIRED' })
    await expect(axios.get('/user/info')).rejects.toMatchObject({ code: 419 })
    expect(useUserStore().token).toBe('')
    expect(pushMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/login', query: expect.objectContaining({ from: '/profile' }) }),
    )
  })

  it('on code 401 → store.logout + redirect', async () => {
    useUserStore().login('tk', { userId: 1 }, Date.now() + 3600_000)
    mock.onGet('/user/info').reply(200, { code: 401, message: 'UNAUTHORIZED' })
    await expect(axios.get('/user/info')).rejects.toMatchObject({ code: 401 })
    expect(useUserStore().token).toBe('')
    expect(pushMock).toHaveBeenCalled()
  })

  it('shows ElMessage.error on business error (e.g. 422)', async () => {
    useUserStore().login('tk', { userId: 1 }, Date.now() + 3600_000)
    mock.onPost('/auth/login/password').reply(200, { code: 422, message: 'BAD_CRED' })
    await expect(axios.post('/auth/login/password', {})).rejects.toMatchObject({ code: 422 })
    expect(ElMessage.error).toHaveBeenCalled()
  })

  it('triggers refresh when expireAt - now < 15min', async () => {
    useUserStore().login('old-tok', { userId: 1, roles: ['user'] }, Date.now() + 5 * 60_000) // 5min left
    const newExp = Date.now() + 7200_000
    mock.onPost('/auth/refresh').reply(200, { code: 200, data: { token: 'new-tok', expireAt: newExp } })
    mock.onGet('/user/info').reply((config) => {
      // 拦截器应使用 refresh 后的 token
      expect(config.headers.Authorization).toBe('Bearer new-tok')
      return [200, { code: 200, data: {} }]
    })
    await axios.get('/user/info')
    expect(useUserStore().token).toBe('new-tok')
  })

  it('does NOT trigger refresh when expireAt - now > 15min', async () => {
    useUserStore().login('tok', { userId: 1 }, Date.now() + 60 * 60_000) // 60min left
    let refreshCalled = 0
    mock.onPost('/auth/refresh').reply(() => {
      refreshCalled++
      return [200, { code: 200, data: { token: 'x', expireAt: Date.now() + 7200_000 } }]
    })
    mock.onGet('/user/info').reply(200, { code: 200, data: {} })
    await axios.get('/user/info')
    expect(refreshCalled).toBe(0)
  })

  it('concurrent requests dedupe refresh call (single in-flight)', async () => {
    useUserStore().login('old', { userId: 1 }, Date.now() + 60_000)
    let refreshCount = 0
    mock.onPost('/auth/refresh').reply(() => {
      refreshCount++
      return [200, { code: 200, data: { token: 'new', expireAt: Date.now() + 7200_000 } }]
    })
    mock.onGet('/api1').reply(200, { code: 200, data: {} })
    mock.onGet('/api2').reply(200, { code: 200, data: {} })
    mock.onGet('/api3').reply(200, { code: 200, data: {} })
    await Promise.all([axios.get('/api1'), axios.get('/api2'), axios.get('/api3')])
    expect(refreshCount).toBe(1)
  })

  it('refresh request itself is exempt from refresh hook (no recursion)', async () => {
    useUserStore().login('old', { userId: 1 }, Date.now() + 60_000)
    let refreshCount = 0
    mock.onPost('/auth/refresh').reply(() => {
      refreshCount++
      return [200, { code: 200, data: { token: 'new', expireAt: Date.now() + 7200_000 } }]
    })
    await axios.post('/auth/refresh')
    expect(refreshCount).toBe(1) // 不会自身触发再次 refresh
  })

  it('login endpoint is exempt from refresh hook', async () => {
    // 即便 expireAt 接近过期, 调登录接口本身不该触发 refresh
    useUserStore().login('old', { userId: 1 }, Date.now() + 60_000)
    let refreshCount = 0
    mock.onPost('/auth/refresh').reply(() => {
      refreshCount++
      return [200, { code: 200, data: { token: 'x', expireAt: Date.now() + 7200_000 } }]
    })
    mock.onPost('/auth/login/password').reply(200, {
      code: 200,
      data: { token: 't', expireAt: Date.now() + 7200_000, user: { userId: 1 } },
    })
    await axios.post('/auth/login/password', {})
    expect(refreshCount).toBe(0)
  })
})
