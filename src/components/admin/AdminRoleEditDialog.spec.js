/**
 * AdminRoleEditDialog — 角色编辑对话框（P4，super_admin only）
 *
 * 行为契约：
 *   - props: open(v-model) / user(含 roles[]) / currentUserId
 *   - 渲染所有可选 role（user/verified_user/creator/moderator/admin/super_admin），prechecked = user.roles
 *   - 至少保留一个角色（空数组 → warning + 不 emit）
 *   - 不能给自己降级（user.userId === currentUserId 且去掉 super_admin → warning）
 *   - submit happy → emit('submit', { add, remove }) 计算 diff
 *   - cancel → emit 'update:open' false
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const elMessageWarning = vi.fn()

vi.mock('element-plus', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: elMessageWarning,
      info: vi.fn(),
    },
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

async function mountDialog(propsOverride = {}) {
  const i18n = await loadI18n()
  const AdminRoleEditDialog = (await import('./AdminRoleEditDialog.vue')).default
  const w = mount(AdminRoleEditDialog, {
    props: {
      open: true,
      user: { userId: 7, username: 'lionel', roles: ['user', 'creator'] },
      currentUserId: 99,
      ...propsOverride,
    },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
  await flushPromises()
  await new Promise((r) => setTimeout(r, 0))
  lastWrapper = w
  return w
}

function toggleRole(roleCode) {
  // 根据组件内 <code>{{ role }}</code> 精确匹配 role code（避免「管理员」混 super_admin）
  const labels = document.querySelectorAll('.el-dialog .el-checkbox')
  for (const el of labels) {
    const code = el.querySelector('code')
    if (code && code.textContent.trim() === roleCode) {
      // 点 label (而非 input) — Element Plus 内部用 label click 来切换状态
      el.click()
      return true
    }
  }
  return false
}

let lastWrapper = null

describe('AdminRoleEditDialog (P4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (lastWrapper) {
      lastWrapper.unmount()
      lastWrapper = null
    }
    document.body.innerHTML = ''
  })

  it('open=true → 渲染 6 个 role checkbox + 预选 user 当前 roles', async () => {
    const w = await mountDialog()
    const boxes = document.querySelectorAll('.el-dialog .el-checkbox')
    // 至少 6 个 role
    expect(boxes.length).toBeGreaterThanOrEqual(6)
    const checked = document.querySelectorAll('.el-dialog .el-checkbox.is-checked')
    expect(checked.length).toBe(2) // user + creator
  })

  it('全部取消勾选 → 点 submit 不 emit + warning', async () => {
    const w = await mountDialog()
    // 直接通过 defineExpose 的 ref 模拟用户取消勾选所有 role（jsdom ElCheckbox label click 不稳定）
    w.vm.checked = []
    await flushPromises()
    document.querySelector('[data-test="adm-roles-submit"]').click()
    await flushPromises()
    expect(w.emitted('submit')).toBeFalsy()
    expect(elMessageWarning).toHaveBeenCalled()
  })

  it('给自己降级 super_admin → warning + 不 emit', async () => {
    const w = await mountDialog({
      user: { userId: 7, username: 'me', roles: ['user', 'super_admin'] },
      currentUserId: 7,
    })
    w.vm.checked = ['user']
    await flushPromises()
    document.querySelector('[data-test="adm-roles-submit"]').click()
    await flushPromises()
    expect(w.emitted('submit')).toBeFalsy()
    expect(elMessageWarning).toHaveBeenCalled()
  })

  it('submit happy → emit submit 含 add / remove diff', async () => {
    const w = await mountDialog()
    // 起始 ['user', 'creator'] → 改为 ['user', 'admin']：add=admin, remove=creator
    w.vm.checked = ['user', 'admin']
    await flushPromises()
    document.querySelector('[data-test="adm-roles-submit"]').click()
    await flushPromises()
    const ev = w.emitted('submit')
    expect(ev).toBeTruthy()
    expect(ev[0][0].add).toContain('admin')
    expect(ev[0][0].remove).toContain('creator')
  })

  it('cancel → emit update:open false', async () => {
    const w = await mountDialog()
    document.querySelector('[data-test="adm-roles-cancel"]').click()
    await flushPromises()
    expect(w.emitted('update:open')[0][0]).toBe(false)
  })
})
