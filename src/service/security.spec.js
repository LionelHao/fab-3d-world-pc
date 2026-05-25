/**
 * service/security — PC 端安全预警接口单测 (user-auth P6)
 *
 * 契约:
 *   listAlerts(filter?)  → GET /user/security/alerts  ⇒ Array<AlertEvent>
 *   AlertEvent: { id, time, location, device, ip, ownership: 'self' | 'unknown' }
 *   acknowledgeAlert(id) → POST /user/security/alerts/{id}/ack
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn(), currentRoute: { value: { fullPath: '/' } } },
}))

vi.mock('@/i18n', () => ({
  t: (k) => k,
}))

describe('service/security — PC P6 安全预警', () => {
  let axios
  let mock
  let security

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const axiosMod = await import('@/utils/axios')
    axios = axiosMod.default
    mock = new MockAdapter(axios)
    security = await import('@/service/security')
  })

  afterEach(() => {
    mock.restore()
  })

  it('listAlerts 调 GET /user/security/alerts 返回数组', async () => {
    mock.onGet('/user/security/alerts').reply(200, {
      code: 200,
      data: [
        {
          id: 'a-1',
          time: '2026-05-25T10:00:00Z',
          location: '深圳',
          device: 'pc',
          ip: '1.1.1.1',
          ownership: 'self',
        },
      ],
    })
    const data = await security.listAlerts()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].id).toBe('a-1')
  })

  it('listAlerts(filter) 带 filter 作 params', async () => {
    mock.onGet('/user/security/alerts').reply((config) => {
      expect(config.params).toEqual({ ownership: 'unknown' })
      return [200, { code: 200, data: [] }]
    })
    await security.listAlerts({ ownership: 'unknown' })
  })

  it('acknowledgeAlert 调 POST /user/security/alerts/{id}/ack', async () => {
    mock.onPost('/user/security/alerts/a-1/ack').reply(200, { code: 200, data: {} })
    await security.acknowledgeAlert('a-1')
  })
})
