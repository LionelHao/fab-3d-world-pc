/**
 * AdminAuditTable — 登录审计表（P4）
 *
 * 行为契约：
 *   - mount → 调 listLoginEvents (default params)
 *   - 渲染数据行
 *   - 过滤 (userId / type / from / to / deviceType / failReason) → 重新调 listLoginEvents
 *   - 重置 → filter 清空 + 重新拉
 *   - 分页 → listLoginEvents with page
 *   - listLoginEvents reject → empty + error toast
 *   - 关键事件（ACCOUNT_LOCKED / PASSWORD_RESET / BAN）行带 crit class
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const listLoginEventsMock = vi.fn()

vi.mock('@/service/admin', () => ({
  listLoginEvents: (...a) => listLoginEventsMock(...a),
}))

const elErrorMock = vi.fn()

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: elErrorMock, warning: vi.fn(), info: vi.fn() },
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

async function mountComp() {
  const i18n = await loadI18n()
  const C = (await import('./AdminAuditTable.vue')).default
  const w = mount(C, {
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  lastW = w
  return w
}

describe('AdminAuditTable (P4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (lastW) { lastW.unmount(); lastW = null }
    document.body.innerHTML = ''
    listLoginEventsMock.mockResolvedValue({
      rows: [
        { createdAt: '2026-05-25T10:00:00Z', userId: 1, identifier: 'alice', eventType: 'LOGIN_SUCCESS', deviceType: 'pc', ip: '1.1.1.1', userAgent: 'UA' },
        { createdAt: '2026-05-25T11:00:00Z', userId: 2, identifier: 'bob', eventType: 'ACCOUNT_LOCKED', deviceType: 'web', ip: '2.2.2.2', userAgent: 'UA' },
        { createdAt: '2026-05-25T12:00:00Z', userId: 3, identifier: 'c', eventType: 'LOGIN_FAIL', deviceType: 'pc', ip: '3.3.3.3', userAgent: 'UA', failReason: 'BAD_PW' },
      ],
      total: 3,
      page: 1,
      size: 20,
    })
  })

  it('mount → 调 listLoginEvents + 渲染 3 行', async () => {
    const w = await mountComp()
    expect(listLoginEventsMock).toHaveBeenCalledTimes(1)
    expect(w.findAll('tbody tr').length).toBe(3)
    expect(w.text()).toContain('LOGIN_SUCCESS')
    expect(w.text()).toContain('ACCOUNT_LOCKED')
  })

  it('listLoginEvents reject → empty + error toast', async () => {
    listLoginEventsMock.mockRejectedValueOnce(new Error('boom'))
    const w = await mountComp()
    expect(w.text()).toContain('暂无审计事件')
    expect(elErrorMock).toHaveBeenCalled()
  })

  it('关键事件行带 crit class（ACCOUNT_LOCKED）', async () => {
    const w = await mountComp()
    const lockedRow = w.findAll('tbody tr').find((r) => r.text().includes('ACCOUNT_LOCKED'))
    expect(lockedRow).toBeTruthy()
    expect(lockedRow.classes()).toContain('adm-audit__row--crit')
  })

  it('点搜索 → 调 listLoginEvents with filter 参数', async () => {
    const w = await mountComp()
    listLoginEventsMock.mockClear()
    const inp = w.find('[data-test="adm-audit-user"] input')
    await inp.setValue('42')
    await w.find('[data-test="adm-audit-search"]').trigger('click')
    await flushPromises()
    expect(listLoginEventsMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }))
  })

  it('点重置 → 清空 filter + 调 listLoginEvents 无 filter', async () => {
    const w = await mountComp()
    const inp = w.find('[data-test="adm-audit-user"] input')
    await inp.setValue('42')
    await flushPromises()
    listLoginEventsMock.mockClear()
    await w.find('[data-test="adm-audit-reset"]').trigger('click')
    await flushPromises()
    expect(listLoginEventsMock).toHaveBeenCalledTimes(1)
    const lastCall = listLoginEventsMock.mock.calls[0][0]
    expect(lastCall.userId).toBeUndefined()
  })
})
