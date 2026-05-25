/**
 * PcSessionList — 单测（user-auth P3 · Settings/Security）
 *
 * 行为契约：
 *   - 渲染 SessionInfo[] 列表（device / ip / loginAt / actions）
 *   - 当前会话渲染 "Current" chip 且 "Revoke" 按钮 disabled
 *   - 非当前会话点 Revoke 按钮 emit('revoke', tokenValue)
 *   - "Sign out other devices" 按钮 emit('revoke-others')
 *   - sessions 为空时显示 empty 文案
 *   - loading=true 时显示 loading 文案
 *   - 仅一行（当前会话）时不显示 revoke-others 按钮
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import PcSessionList from './PcSessionList.vue'

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { warning: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() },
  }
})

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      settings: {
        security: {
          sessions: {
            num: '§ 02',
            name: 'Active Devices',
            stamp: 'SESSIONS',
            title: 'Active Devices',
            current: 'Current',
            revoke: 'Revoke',
            revokeOthers: 'Sign out other devices',
            confirmRevoke: 'Revoke this device?',
            confirmRevokeOthers: 'Sign out all other devices?',
            empty: 'No other active devices',
            loading: 'Loading · standby',
            revokeAria: 'Revoke device {device}',
            deviceWeb: 'Web',
            deviceMobile: 'Mobile',
            deviceDesktop: 'Desktop',
            deviceUnknown: 'Unknown',
            col: {
              device: 'Device',
              ip: 'IP',
              loginAt: 'Login Time',
              lastActive: 'Last Active',
              actions: 'Actions',
            },
          },
        },
      },
    },
  },
})

const mkSession = (overrides = {}) => ({
  tokenValue: 'tok-A',
  deviceType: 'pc',
  ip: '10.0.0.1',
  userAgent: 'Mozilla/5.0',
  loginAt: '2026-05-25T10:00:00Z',
  current: false,
  ...overrides,
})

const mountList = (props = {}) =>
  mount(PcSessionList, {
    props: { sessions: [], loading: false, ...props },
    global: { plugins: [i18n] },
  })

describe('PcSessionList (P3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('渲染 sessions 列表行（device / ip）', () => {
    const w = mountList({
      sessions: [
        mkSession({ tokenValue: 't1', deviceType: 'pc', ip: '1.1.1.1' }),
        mkSession({ tokenValue: 't2', deviceType: 'web', ip: '2.2.2.2' }),
      ],
    })
    const rows = w.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(w.text()).toContain('1.1.1.1')
    expect(w.text()).toContain('2.2.2.2')
  })

  it('当前会话渲染 Current chip + Revoke 按钮 disabled', () => {
    const w = mountList({
      sessions: [mkSession({ current: true, tokenValue: 't1' })],
    })
    expect(w.text()).toContain('Current')
    const btn = w.find('[data-testid="revoke-btn-t1"]')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('非当前会话点 Revoke emit revoke(tokenValue)', async () => {
    const w = mountList({
      sessions: [mkSession({ tokenValue: 'tok-x', current: false })],
    })
    const btn = w.find('[data-testid="revoke-btn-tok-x"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('revoke')).toBeTruthy()
    expect(w.emitted('revoke')[0]).toEqual(['tok-x'])
  })

  it('点 Sign out other devices 按钮 emit revoke-others', async () => {
    const w = mountList({
      sessions: [
        mkSession({ tokenValue: 't1', current: true }),
        mkSession({ tokenValue: 't2', current: false }),
      ],
    })
    const btn = w.find('[data-testid="revoke-others-btn"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('revoke-others')).toBeTruthy()
  })

  it('sessions 空时显示 empty 文案', () => {
    const w = mountList({ sessions: [] })
    expect(w.text()).toContain('No other active devices')
  })

  it('loading=true 时显示 loading 文案', () => {
    const w = mountList({ loading: true, sessions: [] })
    expect(w.text()).toContain('Loading')
  })

  it('仅当前会话一行时不显示 revoke-others 按钮', () => {
    const w = mountList({
      sessions: [mkSession({ tokenValue: 't1', current: true })],
    })
    expect(w.find('[data-testid="revoke-others-btn"]').exists()).toBe(false)
  })

  it('未知 deviceType 走 fallback Unknown 标签', () => {
    const w = mountList({
      sessions: [mkSession({ deviceType: 'tv-cast', tokenValue: 'tx' })],
    })
    expect(w.text()).toContain('Unknown')
  })
})
