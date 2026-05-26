---
id: user-auth.impl.pc
type: impl-manual
status: implemented
owner: lionel
version: v2
ratified_at: 2026-05-25
last_updated: 2026-05-25
parent: ../docs/design/user-auth/01-architecture.md
scope:
  - fab-3d-world-pc
capabilities:
  - user-auth.signup-phone-email
  - user-auth.login-password
  - user-auth.login-code
  - user-auth.password-reset-flow
  - user-auth.session-management
  - user-auth.oauth-binding
  - user-auth.rbac-admin-ops
  - user-auth.mfa-totp
---

# PC 端实施文档 — 登录认证（user-auth）

> **Status**: Draft v2 · **Date**: 2026-05-25（v1 2026-05-24，v2 职责清晰化重写）· **Repo**: fab-3d-world-pc（桌面 + Ops Console）
>
> 本文档是总体方案 `../docs/design/user-auth/01-architecture.md` 的 **PC 端实施手册**。
> 双端共通部分对齐 `fab-3d-world-web/docs/user-auth-impl.md`，本文档侧重 **PC 特有 + Admin auth 运营面** 的工作。
>
> **v2 边界声明**：用户信息管理（Profile 富字段真实切换、头像上传、PcDangerZone 数据导出 / 注销账号、
> admin 资料审核 / 头像审核）**全部不在本期范围**，归 user-info 模块——占位
> `../docs/design/user-info/01-architecture.md`。本期 PC 端只动认证、PcSessionList、密码修改、Admin
> auth 运营面（用户列表 / 封禁 / 角色 / 强制下线 / 登录审计）。
>
> **⚠ 强制 TDD**：所有改造必须先写 Vitest 单测 / Playwright E2E，再写实现。详见 §7。

---

## 0. 总览

### 0.1 与 Web 端的共通改造（同源副本对齐）

下列文件**两端结构完全一致**，PC 端只是 storage 命名空间换成 `fab.pc`、device-type header 换成 `pc`：

- `src/utils/axios.js` — refresh 拦截器 + 错误码 419 + X-Device-Type
- `src/stores/user.js` — 命名空间 `fab.pc.*` + 自动迁移旧 `pc_token`/`pc_userInfo`
- `src/router/index.js` — 删 BYPASS_AUTH + `requiresRoles` 守卫
- `src/service/auth.js` *新* — auth 接口集中（login / signup / refresh / sms / sessions / pw reset / oauth）
- `src/service/user.js` — **收敛**到仅 `getUserInfo()` 返回 auth 域最小集
- `src/locales/*/auth.json` — 双语错误码
- Vitest / Playwright 接入

**这些改造的细节请直接参考** `fab-3d-world-web/docs/user-auth-impl.md` §1 ~ §7，本文档不重复，仅列差异点。

### 0.2 PC 特有改造

| 文件 | 用途 |
|---|---|
| `src/views/Login.vue` | 统一 identifier 登录 + 启用注册入口（取代「联系运营」弹窗）+ 验证码可选 |
| `src/views/Admin.vue` | 改用 `userStore.isAdmin` getter；权限路径细化 |
| `src/components/admin/AdminUserMgmt.vue` *新* | 用户管理表格（list / detail / ban / unban / set-role） |
| `src/components/admin/AdminAuditTable.vue` *新* | 登录审计表（替换现有 mock Stream） |
| `src/views/SettingsSecurity.vue` *新* | 独立路由 Security 区：设备列表 + 修改密码 + 登出全部（**不放 Profile 设置区**） |
| `src/components/settings/PcSessionList.vue` *新* | 设备列表（放在 SettingsSecurity 内） |
| `src/service/admin.js` | 加 users / roles / audit 接口 |

> **本期不新建（归 user-info 模块）**：
> - `src/components/profile/PcDangerZone.vue`（数据导出 / 注销账号）
> - Profile fixture 真实字段切换（cd-9-fixture.js）
> - 头像上传 / 资料编辑 UI
> - Admin 用户资料编辑 / 头像审核

### 0.3 关键差异点

| 维度 | Web | PC |
|---|---|---|
| storage namespace | `fab.web.*` | `fab.pc.*` |
| X-Device-Type | `web` | `pc` |
| 注册入口 | 内联 register 模式 | P1 启用注册（去掉「联系运营」） |
| OAuth provider | 移动友好（微信/Apple） | 桌面友好（Google/GitHub/Apple） |
| Admin 入口 | 无 | `/admin` 路由（仅 admin/super_admin 可见） |
| Settings/Security 位置 | 独立路由 `/settings/security` | 独立路由 `/settings/security`（**不并入 Profile 设置区**） |

---

## 1. P1 PC 特有改造

### 1.1 storage 命名空间 + 旧 key 迁移

`src/stores/user.js`（与 Web 对应文件结构相同，仅 NS 不同）：

```javascript
const NS = 'fab.pc'

function migrateLegacy() {
  const oldToken = localStorage.getItem('pc_token')
  const oldUser = localStorage.getItem('pc_userInfo')
  if (oldToken && !localStorage.getItem(`${NS}.token`)) {
    localStorage.setItem(`${NS}.token`, oldToken)
    if (oldUser) localStorage.setItem(`${NS}.user`, oldUser)
    localStorage.setItem(`${NS}.expireAt`, '0')
  }
  localStorage.removeItem('pc_token')
  localStorage.removeItem('pc_userInfo')
}
migrateLegacy()
```

其余 store actions/getters 与 Web 一致。

### 1.2 axios 中 X-Device-Type

```javascript
const DEVICE_TYPE = 'pc'   // ← 与 Web 唯一不同的常量
```

### 1.3 Login.vue 改造（启用注册）

PC 当前注册按钮是 `ElMessage.info('联系运营')`，改为：

```diff
- const onRegister = () => ElMessage.info(t('login.msg.registerContactOps'))
+ const mode = ref('login')  // 'login' | 'register'
+ const onToggleMode = () => { mode.value = mode.value === 'login' ? 'register' : 'login' }
```

模板内根据 `mode === 'register'` 显示完整注册表单（手机+邮箱+密码+验证码 + 同意条款）。结构类似 Web 端 Login.vue 的 register 分支，只是用 Element Plus（`ElForm` / `ElInput`）而非 Vant。

**username/phone/email 统一 identifier**：登录模式仅一个输入框，placeholder「用户名 / 手机号 / 邮箱」。

### 1.4 router 改 requiresRoles

```diff
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
-   meta: { requiresAuth: true, requiresAdmin: true }
+   meta: { requiresAuth: true, requiresRoles: ['admin', 'super_admin'] }
  }
```

router.beforeEach：

```javascript
if (to.meta.requiresRoles && !to.meta.requiresRoles.some(r => userStore.hasRole(r))) {
  ElMessage.warning(t('common.toast.forbidden'))
  next('/home')
  return
}
```

### 1.5 service/auth.js + service/user.js + service/admin.js

- 新建 `src/service/auth.js`（auth 接口集中，与 Web 同源副本对齐）—— 详见 Web impl §1.5
- 收敛 `src/service/user.js` 为仅 `getUserInfo()` 返回 auth 域最小集；资料 / 头像 / stat / 导出 / 注销
  全归 user-info 模块
- 新建 `src/service/admin.js`（auth 运营面接口）：

```javascript
import axios from '../utils/axios'

export const listUsers = (params) => axios.get('/admin/users', { params })
export const getUserDetail = (id) => axios.get(`/admin/users/${id}`)
export const banUser = (id, params) => axios.put(`/admin/users/${id}/ban`, params)
export const unbanUser = (id) => axios.put(`/admin/users/${id}/unban`)
export const setUserRoles = (id, params) => axios.put(`/admin/users/${id}/roles`, params)
export const revokeAllSessions = (id) => axios.post(`/admin/users/${id}/sessions/revoke-all`)
export const listLoginEvents = (params) => axios.get('/admin/audit/login-events', { params })

// 现有 dashboard / posts / orders 保留
export const getDashboard = () => axios.get('/admin/dashboard')
// ...
```

---

## 2. P4 — Admin auth 运营面实施

> 本期 Admin Console **只做 auth 运营面**（用户列表 / 封禁 / 角色 / 强制下线 / 登录审计）。
> 用户资料编辑、头像审核、资料违规处置归 user-info 模块。

### 2.1 用户管理页（auth 字段为主）

新建 `src/components/admin/AdminUserMgmt.vue`：

- 顶部搜索（keyword）+ 过滤（status / role）+ 分页
- 表格：username / phone（脱敏）/ email（脱敏）/ status / roles / lastLoginAt / 操作
- **不显示** nickname / avatar / bio / tier 等 user-info 字段
- 操作列：详情 / 角色编辑 / 封禁/解封 / 强制下线
- 角色编辑用 `ElDialog` + `ElCheckboxGroup`
- 封禁用 `ElDialog` 输入 reason + 可选 untilAt

```vue
<template>
  <AdminCard :title="t('admin.users.title')">
    <div class="admin-users__filter">
      <ElInput v-model="filter.keyword" :placeholder="t('admin.users.search')" clearable />
      <ElSelect v-model="filter.status">...</ElSelect>
      <ElSelect v-model="filter.role">...</ElSelect>
      <UiButton variant="secondary" @click="onSearch">{{ t('common.search') }}</UiButton>
    </div>

    <ElTable :data="rows" v-loading="loading">
      <ElTableColumn prop="username" :label="t('admin.users.col.username')" />
      <ElTableColumn prop="phoneMasked" :label="t('admin.users.col.phone')" />
      <ElTableColumn prop="emailMasked" :label="t('admin.users.col.email')" />
      <ElTableColumn :label="t('admin.users.col.status')" v-slot="{ row }">
        <span :class="['stat-pill', `stat-pill--${row.status.toLowerCase()}`]">{{ row.status }}</span>
      </ElTableColumn>
      <ElTableColumn :label="t('admin.users.col.roles')" v-slot="{ row }">
        <span v-for="r in row.roles" :key="r" class="role-chip">{{ r }}</span>
      </ElTableColumn>
      <ElTableColumn :label="t('admin.users.col.actions')" width="240" v-slot="{ row }">
        <UiButton size="md" @click="onDetail(row)">{{ t('admin.users.detail') }}</UiButton>
        <UiButton size="md" v-if="userStore.hasRole('super_admin')" @click="onEditRoles(row)">
          {{ t('admin.users.editRoles') }}
        </UiButton>
        <UiButton size="md" v-if="row.status === 'NORMAL'" @click="onBan(row)">{{ t('admin.users.ban') }}</UiButton>
        <UiButton size="md" v-else @click="onUnban(row)">{{ t('admin.users.unban') }}</UiButton>
      </ElTableColumn>
    </ElTable>

    <ElPagination v-model:current-page="page" :total="total" :page-size="size" @current-change="onPage" />
  </AdminCard>
</template>
```

`onEditRoles` 仅 super_admin 显示（前端 + 后端双重校验）。

### 2.2 登录审计页

新建 `src/components/admin/AdminAuditTable.vue`：

- 过滤：userId / eventType / from / to / deviceType / fail_reason
- 表格：created_at / userId / identifier / event_type / device_type / ip / ua / fail_reason
- 关键事件高亮（如 `ACCOUNT_LOCKED`）

替换现有 `Admin.vue` 内的 AdminStream/AdminAlert mock 组件（保留视觉壳，数据源改 `listLoginEvents`）。

### 2.3 现有 Admin.vue 改造

`isAdmin` getter 当前看 `userInfo.role`，改用 store getter（已支持 roles 数组）。`isAdmin` 计算从 `state.userInfo.role === 'admin'` 改为：

```javascript
isAdmin: s => Array.isArray(s.user?.roles) && (s.user.roles.includes('admin') || s.user.roles.includes('super_admin'))
```

侧栏 tabs 按 role 显示：

| Tab | role 要求 |
|---|---|
| Dashboard | admin+ |
| Users | admin+ |
| Roles (新) | super_admin |
| Posts | admin+ / moderator |
| Orders | admin+ |
| Audit | admin+ / moderator |
| Settings | super_admin |

`v-if="userStore.hasRole('super_admin')"` 控制显隐。

---

## 3. P2 — Profile 真实字段切换（PC）【归 user-info 模块】

**本期 PC 端不做 Profile fixture 真实字段切换。** 归 user-info 模块——`src/mocks/cd-9-fixture.js`
的 `enrichProfilePc` 改造（含 identity / dossier / telemetry.items / stats / activity.rows /
achievements.items 等字段映射）整体延期。

本期约定：

- `Profile.vue` 调 `getUserInfo()` 拿 auth 域最小集，软兜底 `nickname / avatar`
- 其余 dossier / telemetry / stats / activity / achievements 全走 fixture
- **不删** `// TODO: backend integration` 标记

---

## 4. P3 — Settings/Security 区（设备列表 + 密码修改）

### 4.0 UI 落点

**独立路由 `/settings/security`**（**不放 Profile sidebar / Profile §05.Account 内**），新建
`src/views/SettingsSecurity.vue`，作为 PC 端账号安全集中入口。Profile 视图维持「资料展示」职责，
不混入安全操作。

### 4.1 PcSessionList 组件

放在 `SettingsSecurity.vue` 内（**不**放 Profile sidebar §02.Sessions）：

```vue
<PcSubSection :title="t('settings.sessions.title')" stamp="ACTIVE">
  <table class="sess-table">
    <thead>
      <tr>
        <th>{{ t('settings.sessions.col.device') }}</th>
        <th>{{ t('settings.sessions.col.ip') }}</th>
        <th>{{ t('settings.sessions.col.loginAt') }}</th>
        <th>{{ t('settings.sessions.col.actions') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in sessions" :key="s.id" :class="{ 'sess-row--curr': s.current }">
        <td>{{ s.deviceType.toUpperCase() }}<span v-if="s.current" class="curr-chip">{{ t('settings.sessions.current') }}</span></td>
        <td>{{ s.ip }}</td>
        <td>{{ formatRelativeTime(s.loginAt) }}</td>
        <td>
          <UiButton v-if="!s.current" size="md" variant="secondary" @click="onRevoke(s.id)">
            {{ t('settings.sessions.revoke') }}
          </UiButton>
        </td>
      </tr>
    </tbody>
  </table>
  <UiButton variant="primary" @click="onRevokeOthers">{{ t('settings.sessions.revokeOthers') }}</UiButton>
</PcSubSection>
```

### 4.2 密码修改 ElDialog

`SettingsSecurity.vue` 内「修改密码」按钮 → 弹 ElDialog：旧密码 / 新密码 / 确认新密码，提交调
`changePassword`（来自 `service/auth.js`），成功后调 `logout()` + `router.push('/login')`
（后端会下线全设备）。

### 4.3 数据导出 + 注销账号（PcDangerZone）【归 user-info 模块】

**本期不做。** `PcDangerZone.vue` 组件、`exportMyData()` 调用、`deleteAccount(pw, reason)` 调用——
全部延期到 user-info 模块（合规操作，与个人资料一并处理）。

---

## 5. P5 — OAuth（PC 偏重桌面 provider）

PC Login.vue 加 OAuth 区块，启用 provider 按 locale：

- `zh-CN` → `['wechat-mobile', 'apple']`（移动微信扫码登录 + Apple Sign-In on Web）
- `en-US` → `['google', 'apple', 'github']`

实现细节同 Web 端 §4，把 Vant 组件换 Element Plus。

---

## 6. i18n 新增 namespace

### 6.1 admin.json 新增

`src/locales/zh-CN/admin.json`：

```json
{
  "users": {
    "title": "用户管理",
    "search": "搜索用户名 / 手机 / 邮箱",
    "col": {
      "username": "用户名", "phone": "手机", "email": "邮箱",
      "status": "状态", "roles": "角色", "lastLogin": "最后登录", "actions": "操作"
    },
    "detail": "详情", "editRoles": "编辑角色", "ban": "封禁", "unban": "解封",
    "banDialog": { "title": "封禁用户", "reason": "原因（必填）", "until": "截止时间（可选，留空永久）" },
    "rolesDialog": { "title": "编辑角色", "help": "勾选授予的角色" }
  },
  "audit": {
    "title": "登录审计",
    "filter": { "userId": "用户 ID", "type": "事件类型", "from": "起始时间", "to": "截止时间", "device": "设备" },
    "col": { "time": "时间", "user": "用户", "event": "事件", "device": "设备", "ip": "IP", "reason": "失败原因" }
  }
}
```

英文版镜像 EN。务必跑 `node scripts/check-i18n-parity.mjs` 全过。

### 6.2 settings.json / auth.json

与 Web 端共享同名 key（详见 web `user-auth-impl.md` §5-6）。复制粘贴 PC 版本，UPPER CASE / mono 风格按 Paper-CAD 设计。

---

## 7. TDD 工作流（强制）

### 7.1 测试栈

- **Vitest**：组件 / store / utils / 拦截器单测，覆盖率 ≥80%
- **Playwright**：4 条 golden path E2E + admin 关键路径（用户管理、审计查询）
- 同 Web 端的工具链配置

### 7.2 单测样例（admin store getter）

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user'

describe('PC user store isAdmin', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  it('returns true for admin role', () => {
    const s = useUserStore()
    s.login('t', { userId: 1, roles: ['admin'] }, Date.now() + 3600_000)
    expect(s.isAdmin).toBe(true)
  })

  it('returns true for super_admin role', () => {
    const s = useUserStore()
    s.login('t', { userId: 1, roles: ['super_admin'] }, Date.now() + 3600_000)
    expect(s.isAdmin).toBe(true)
  })

  it('returns false when only user role', () => {
    const s = useUserStore()
    s.login('t', { userId: 1, roles: ['user', 'creator'] }, Date.now() + 3600_000)
    expect(s.isAdmin).toBe(false)
  })

  it('returns false when roles is undefined', () => {
    const s = useUserStore()
    s.login('t', { userId: 1 }, Date.now() + 3600_000)
    expect(s.isAdmin).toBe(false)
  })
})
```

### 7.3 E2E 样例（admin 路由）

`tests/e2e/admin-rbac.spec.js`：

```javascript
import { test, expect } from '@playwright/test'

test.describe('Admin RBAC gating', () => {
  test('non-admin user blocked from /admin', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('fab.pc.token', 'fake')
      localStorage.setItem('fab.pc.user', JSON.stringify({ userId: 1, roles: ['user'] }))
      localStorage.setItem('fab.pc.expireAt', String(Date.now() + 3600_000))
    })
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/home/)
  })

  test('admin user reaches /admin', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('fab.pc.token', 'fake')
      localStorage.setItem('fab.pc.user', JSON.stringify({ userId: 1, roles: ['admin'] }))
      localStorage.setItem('fab.pc.expireAt', String(Date.now() + 3600_000))
    })
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('non-super_admin cannot see Roles tab', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('fab.pc.token', 'fake')
      localStorage.setItem('fab.pc.user', JSON.stringify({ userId: 1, roles: ['admin'] }))
      localStorage.setItem('fab.pc.expireAt', String(Date.now() + 3600_000))
    })
    await page.goto('/admin')
    await expect(page.getByText('Roles')).not.toBeVisible()
  })
})
```

### 7.4 任务级 TDD 准入清单

每个 PR 必填：

```markdown
## TDD 检查（PC）
- [ ] RED：先写了测试且确认失败（commit hash: ___）
- [ ] GREEN：所有测试通过（`npm run test:run` 截图）
- [ ] REFACTOR：完成代码整理
- [ ] 覆盖率：`npm run test:coverage` 出报告，LINE ≥ 80%
- [ ] E2E：相关 golden path 跑通（贴 Playwright trace 链接）
- [ ] Admin 改动需 RBAC 测试：非 admin 阻挡 / super_admin 可见
- [ ] i18n parity：`node scripts/check-i18n-parity.mjs` 全过
- [ ] 无 console.log / 无 BYPASS_AUTH 残留
- [ ] storage key 检查：无 `pc_*` 残留（用 `grep -r "pc_token\|pc_userInfo" src/`）
```

---

## 8. P1 任务清单（PC 端）

| # | Task | 测试先写 | 实现 |
|---|---|---|---|
| C1.1 | Pinia store 重构 + `pc_*` → `fab.pc.*` 自动迁移 | user.spec.js（同 Web 6+ cases）| §1.1 |
| C1.2 | axios 拦截器（device='pc'）+ 删 BYPASS_AUTH | axios.spec.js | §1.2 |
| C1.3 | router `requiresRoles` 守卫 | router.spec.js + E2E RBAC | §1.4 |
| C1.4 | **拆** service/auth.js + 收敛 service/user.js + 新建 service/admin.js | mock 通过 | §1.5 |
| C1.5 | Login.vue 启用注册 + 统一 identifier | E2E 注册/登录 path | §1.3 |
| C1.6 | i18n `auth.error/biz/code/pwReset/consent` | parity 脚本 | §6 |
| C1.7 | Vitest + Playwright + coverage 接入 | self-test | §7 |
| C1.8 | Admin.vue isAdmin getter 切换 + 侧栏 role gating | E2E admin-rbac.spec.js | §2.3 |

---

## 9. P2-P6 简表

| Phase | PC 工作 |
|---|---|
| P2 | 密码重置流程 UI（独立路由 `/forgot-password`）；email/phone verify UI |
| P3 | `SettingsSecurity.vue` 独立路由：PcSessionList + 修改密码 ElDialog + 登出全部其他设备 |
| P4 | **AdminUserMgmt 用户管理表（auth 字段）** + **AdminAuditTable 登录审计表** + 角色编辑 dialog（super_admin only）+ Ops Console 替换现有 mock Stream/Alert |
| P5 | OAuth 按钮（桌面 provider）+ 回调路由处理；SettingsSecurity 加绑定/解绑区 |
| P6 | 异地登录二次验证 UI / CAPTCHA |

> ❌ **不在 PC 端本期 P 阶段**（归 user-info 模块）：Profile fixture 真实切换（cd-9）、头像上传 UI、
> PcDangerZone（数据导出 / 注销账号）、Admin 用户资料编辑 / 头像审核、公开主页视图、S3/MinIO presign。

每阶段一 PR，每 PR 走 §7.4 TDD 清单。

---

## 10. 联调注意

- backend dev `http://192.168.31.21:8201/`
- Ops Console 测试要 super_admin 账号——staging 由运维 SQL 种子建 + 给 user_role 行
- **本期不联调** MinIO / S3（归 user-info 模块）

---

## 11. 关键引用

- 总体方案：`../docs/design/user-auth/01-architecture.md`
- user-info 占位：`../docs/design/user-info/01-architecture.md`
- 后端契约：`fab-3d-world-api/docs/user-auth-impl.md`
- Web 端共通改造：`fab-3d-world-web/docs/user-auth-impl.md`（详见 §1-§7，PC 端绝大部分代码直接套用）
- I18N 规范：根 CLAUDE.md §I18N
- 设计 token：`../packages/design-tokens/tokens.css`

---

**End of PC Impl Doc v2.**
