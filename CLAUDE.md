# fab-3d-world-pc — Claude 协作规范（桌面 + Ops Console）

> **项目角色**：fab-3d-world PC Web 端（桌面浏览 + 创作者社区 + 商城 + **Ops Console / Admin** 运营后台）
> **父规范**：`../CLAUDE.md`（fab-3d-world 项目总规范）—— **先读它**。本文档是 PC 端独有的强化条款，**覆盖**于父规范。
> **同源对等文档**：`fab-3d-world-web/CLAUDE.md`（双端共用 primitive、I18N、design token、TDD 规范等）

---

## 0. 子项目快照

### 0.1 技术栈

| 维度 | 选型 | 备注 |
|---|---|---|
| 框架 | **Vue 3.5+**（Composition API + `<script setup>`） | 禁用 Options API |
| 构建 | **Vite 5.x** | HMR / esbuild / Rollup prod |
| 路由 | **Vue Router 4** | createWebHistory |
| 状态 | **Pinia 2.x** | 命名空间 `fab.pc.*` 持久化到 localStorage |
| UI 组件库 | **Element Plus 2.x** | 桌面端 ElTable / ElDialog / ElForm 为主；通过 `ui/` 薄壳调用 |
| 3D 引擎 | **online-3d-viewer + three.js** | Phase 4 接入；用 `utils/viewerSoul.js` |
| 动画 | **motion-v 2.2.1** | 仅用 `ui/UiReveal` 薄壳 |
| HTTP | **axios 1.x** | `utils/axios.js` 统一拦截器 |
| 国际化 | **vue-i18n 11** | `<el-config-provider :locale>` 包根 |
| 测试 | **Vitest** + **@vitest/coverage-v8** + **Playwright** | TDD 强制 |
| Node | ≥ 20.x | `.nvmrc` 待加 |

### 0.2 仓库状态

- **独立 git repo**：`LionelHao/fab-3d-world-pc` (`main` branch)
- 父目录 `fab-3d-world/` 非 git repo
- 双端同源副本：`viewerSoul.js` / `UiReveal.vue` / I18N store / locale switcher / axios / user store —— 改一端必同步 Web 端

### 0.3 关键差异于 Web

| 维度 | Web | PC |
|---|---|---|
| 形态 | 移动 H5（375-414px 主视口） | 桌面（1200-1920px 主视口） |
| UI 库 | Vant | **Element Plus** |
| storage namespace | `fab.web.*` | **`fab.pc.*`** |
| X-Device-Type | `web` | **`pc`** |
| Admin 入口 | 无 | **`/admin` 路由（仅 admin/super_admin 可见）** |
| OAuth provider 偏好 | 移动微信 / Apple | 桌面 Google / GitHub / Apple |
| primitive 命名 | `Ui*` | **`Ui*`（5 件套从 web port）+ `Pc*`（PC 特有：PcNavbar/PcMakerCard/AdminUserMgmt/...）** |

### 0.4 关键目录

```
src/
├── views/              页面（Home / Market / GoodsDetail / PostDetail / Profile / Admin / Login）
├── components/
│   ├── ui/             primitive 件套（从 web port + PC 特有）
│   ├── home/           home section 组件
│   ├── profile/        Profile 区组件（含 sidebar / dossier / activity）
│   ├── admin/          **Ops Console 组件**（AdminNav, AdminCard, AdminKpiCard, AdminStream, AdminAlert, AdminTicketsTable, AdminSidebar, ...）
│   ├── PcNavbar.vue / PcTelemetryStrip.vue / PcSectionHeader.vue / PcFooter.vue
│   └── PcLocaleSwitcher.vue
├── stores/             Pinia stores
├── service/            HTTP 接口（user.js / admin.js / goods.js / content.js / model.js）
├── utils/              工具（axios / parseRich / viewerSoul / ...）
├── i18n/               vue-i18n 配置 + locale 检测
├── locales/<locale>/   翻译资源
├── router/             路由 + 守卫
├── mocks/              cd-9-fixture.js（PC Profile fixture）+ admin 各 fixture
├── common/             跨页共享逻辑
└── style.css           全局样式

public/
└── ...

docs/                   本仓库文档（user-auth-impl.md / 等）
```

---

## 1. 编码风格

> 父级 `~/.claude/rules/common/coding-style.md` + `~/.claude/rules/typescript/coding-style.md` + Web 端 CLAUDE.md §1 等同适用。下面是 PC 端独有要点。

### 1.1 Element Plus 使用

✅ **必须**：

- 通过 `components/ui/` 薄壳调用 Element 组件，避免业务直接耦合
- Element 全局 locale 走 `<el-config-provider :locale="elLocale">` 包根（`App.vue` 已配，业务不重复）
- ElMessage / ElNotification / ElMessageBox 入参文案必须 `t()`
- 表格分页用 `ElPagination`，参数 `currentPage` / `pageSize` 走 `v-model:current-page` / `:page-size`

❌ **禁止**：

- 业务组件内直接 import `ElXxx` 不经薄壳（除非已是 chrome 级组件）
- 在业务层覆盖 Element 默认主题色（必须 token 覆盖在全局 style.css）
- 在 ElDialog 嵌套超过 1 层（嵌套对话框设计上问题）

### 1.2 Admin / Ops Console 规范

- **所有 Admin 组件**放 `components/admin/`，命名 `Admin*`
- 进入 `/admin` 路由必须有 `requiresAuth: true` + `requiresRoles: ['admin', 'super_admin']`
- **二次校验**：前端 v-if 隐藏 UI 是 UX，后端必须再校验权限（不可信赖前端）
- 危险操作（封禁 / 角色修改 / 删除）走 ElMessageBox 二次确认
- 角色修改 UI **仅** super_admin 可见（`v-if="userStore.hasRole('super_admin')"`）
- Admin 表格必须支持：分页、过滤、排序、批量选中（按需）

### 1.3 Composition API patterns

- 复杂业务用 `composables/use<Feature>.js`，避免 view 内逻辑过 200 行
- 表格数据按"查询 + 加载 + 错误"三态写：

```javascript
const rows = ref([])
const loading = ref(false)
const error = ref(null)
async function fetchUsers() {
  loading.value = true; error.value = null
  try { rows.value = await listUsers(filter.value) }
  catch (e) { error.value = e; ElMessage.error(t('admin.users.loadFailed')) }
  finally { loading.value = false }
}
```

---

## 2. Design System 落地（PC 侧重）

> 完整规范见父 `CLAUDE.md` §Design System。下面是 PC 端的执行要点。

### 2.1 视口策略

- 主设计稿 **1440px**；最小支持 **1280px**
- Admin Console 主设计 **1600px**；最小 **1366px**
- 大于 1920px 居中布局，不拉伸 content；侧栏可固定 200px / 240px
- 移动端不支持（< 768px 直接降级提示 "请在桌面端访问"）

### 2.2 PC 特有 primitive

| 名称 | 用途 |
|---|---|
| `PcNavbar` / `PcTelemetryStrip` / `PcFooter` | chrome 三件套 |
| `PcSectionHeader` | 区段头条 |
| `PcMakerCard` / `PcFarmCard` / `PcHeroPlate` / `PcHeroCopy` | Home section 件套 |
| `PcCtaStack` / `PcViewerStage` / `PcDetailStick` / `PcFileRow` / `PcRelatedCard` | 详情页 5 件套 |
| `profile/PcProfileSidebar` / `PcSubSection` / `PcActivityLog` / `PcAchievementCard` | Profile 4 件套 |
| `admin/AdminNav` / `AdminTelemetry` / `AdminSidebar` / `AdminFooter` | Admin chrome |
| `admin/AdminCard` / `AdminKpiCard` / `AdminStream` / `AdminAlert` / `AdminTicketsTable` | Admin 数据卡 5 |

新页面**先**查现有 primitive，能扩展不新建（详见父 CLAUDE.md §Primitives 完整清单）。

### 2.3 ElTable 风格统一

封装 `ui/UiAdminTable.vue`（待加）薄壳 ElTable，统一：

- 表头 ink 黑底 / paper 字
- 行间距 14px / 等宽 mono 字体
- 状态 chip 标签（success / warn / danger 用 tokens 色）
- empty 状态走 `<template #empty>` 自定 "NO DATA" 模板

---

## 3. I18N 规范

> 完整规范见父 `CLAUDE.md` §I18N + Web 端 `CLAUDE.md` §3。下面是 PC 独有 namespace。

- PC 当前 8 个 namespace（home/market/postDetail/goodsDetail/profile/admin/login/common）
- **Admin 内组件**文案集中在 `admin.json`；未来扩展按子模块分（`admin/users.json` / `admin/audit.json`）
- ElMessage 入参必须 `t()`，禁止硬编码 `ElMessage.info('xxx')` 中文
- 提交前 `node ../scripts/check-i18n-parity.mjs` 全过

---

## 4. 路由 / 守卫 / RBAC

### 4.1 路由表

```javascript
const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home',       component: () => import('@/views/Home.vue') },              // 公开
  { path: '/market',     component: () => import('@/views/Market.vue') },            // 公开
  { path: '/post/:id',   component: () => import('@/views/PostDetail.vue') },        // 公开
  { path: '/goods/:id',  component: () => import('@/views/GoodsDetail.vue') },       // 公开
  { path: '/login',      component: () => import('@/views/Login.vue') },             // 公开
  { path: '/profile',    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true } },
  { path: '/admin',      component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresRoles: ['admin', 'super_admin'] } },
]
```

### 4.2 守卫双层

1. **客户端守卫**（router.beforeEach）— UX 跳转，提前拦截
2. **服务端守卫**（gateway SaToken filter）— 真正的安全边界

**永远不**只靠前端守卫做权限控制。

### 4.3 角色枚举

| role | 描述 | UI 影响 |
|---|---|---|
| `user` | 普通用户 | 可看 profile，不能进 admin |
| `verified_user` | 双因素已验证 | 解锁高级操作 |
| `creator` | 已上传 ≥1 模型 | 可发布 / 编辑作品 |
| `moderator` | 审核员 | `/admin` 部分入口可见（审计 / 内容审核） |
| `admin` | 平台运营 | `/admin` 全入口 |
| `super_admin` | 平台所有者 | + 角色管理 / 系统设置 |

### 4.4 v-if 权限示例

```vue
<UiButton v-if="userStore.hasRole('super_admin')" @click="onEditRoles">编辑角色</UiButton>
<AdminUserMgmt v-if="userStore.hasRole('admin') || userStore.hasRole('super_admin')" />
```

---

## 5. TDD —— 强制开发流程（PC 版）

> 父 `CLAUDE.md §TDD` 与 Web 端 `CLAUDE.md §6` 等同适用。下面是 PC 独有要点。

### 5.1 工具链

同 Web 端：Vitest + coverage-v8 + Playwright + @vue/test-utils + axios-mock-adapter

### 5.2 Admin / RBAC 必备测试

**所有 admin 路由 / 组件改动必须配套**：

- ✅ E2E：non-admin 访问 `/admin` → 跳 `/home`
- ✅ E2E：admin 访问 `/admin` → 正常加载
- ✅ E2E：super_admin 看到角色编辑入口；admin 看不到
- ✅ 单测：`userStore.isAdmin` getter 在各 role 组合下的返回值
- ✅ 单测：`userStore.hasRole('xxx')` 正确判断

参考 `docs/user-auth-impl.md` §7.3 E2E admin-rbac.spec.js 模板。

### 5.3 Element 表格测试

```javascript
import { mount } from '@vue/test-utils'
import { ElTable, ElTableColumn } from 'element-plus'
import AdminUserMgmt from './AdminUserMgmt.vue'

it('renders rows from service', async () => {
  // mock listUsers
  vi.mock('@/service/admin', () => ({
    listUsers: vi.fn().mockResolvedValue({ rows: [{ id: 1, username: 'lionel' }], total: 1 }),
  }))
  const wrapper = mount(AdminUserMgmt, { global: { plugins: [/* element-plus, pinia */] } })
  await flushPromises()
  expect(wrapper.text()).toContain('lionel')
})
```

### 5.4 Playwright 桌面视口

`playwright.config.js`：

```javascript
projects: [
  { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  { name: 'firefox-desktop',  use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
  { name: 'webkit-desktop',   use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
]
```

### 5.5 覆盖率门禁

`LINE ≥ 80%`；admin 模块单独要求 `≥ 85%`（敏感操作）。

### 5.6 AI 编码自检

同 Web：写任何业务代码前先列测试清单 + 写第一个测试跑红。Admin / RBAC 改动额外要求 E2E 跑通 admin-rbac.spec.js。

跳测试的 commit 注 `[tdd-skip: <reason>]`，仅限纯样式 / 文档 / locale / 依赖升级。

---

## 6. 安全硬性条款（PC 版）

继承 Web 端 §7 所有条款。**额外** PC 独有：

- ❌ **绝不允许**业务层硬编码 admin 凭据（即使为 staging）
- ❌ **绝不允许**前端单纯靠 `v-if` 控制 admin 入口而不做服务端校验
- ❌ **绝不允许**在生产环境保留 `BYPASS_AUTH` flag 或类似 debug 旁路
- ✅ Admin 危险操作（封禁 / 角色变更 / 删除）必须二次确认（ElMessageBox.confirm）
- ✅ Admin 操作记录到 `user_login_event`（后端职责，前端确保走标准 service 接口）
- ✅ `console.log` 在 admin 模块**完全禁止**（敏感信息泄露风险）

提交前自检：

```bash
grep -rn "console.log\|console.debug" src/components/admin/   # 必须零结果
grep -rn "BYPASS_AUTH" src/                                    # 必须零结果
grep -rn "pc_token\|pc_userInfo" src/                          # 应在 store migrateLegacy 之外零结果
```

---

## 7. 性能要点

- ElTable 大数据用虚拟滚动（`row-key` + `v-loading`）
- Admin Console 单页路由懒加载子组件
- 不要在 `Admin.vue` 一次性 import 全部 admin 组件，按 tab 切换才 import
- ElDialog 关闭时 `destroy-on-close`（避免 DOM 残留）
- 图片走 CDN + `loading="lazy"`

---

## 8. 提交规范

- Conventional Commits + 中文描述 ≤50 字
- scope：`pc` / `pc/admin` / `pc/profile` 等
- 提交前必须：
  - [ ] `npm run test:run` 全绿
  - [ ] `npm run test:coverage` 覆盖率不掉
  - [ ] `npm run dev` 看一眼视觉（特别是 admin 变更，必须打开 `/admin` 看一眼）
  - [ ] `node ../scripts/check-i18n-parity.mjs` 全过

---

## 9. dev 启动 / 联调

```bash
# 1. 起后端 + 依赖
cd ../fab-3d-world-api/docker && docker compose up -d
cd ../ && mvn -pl fab-3d-world-gateway,fab-3d-world-auth,fab-3d-world-user,fab-3d-world-admin -am spring-boot:run

# 2. 起前端
cd ../../fab-3d-world-pc
cp .env.example .env.development.local   # 改 VITE_API_BASE_URL
npm install
npm run dev                              # http://localhost:5174（避开 web 的 5173）

# 3. 跑测试
npm run test       # watch
npm run test:e2e   # E2E（含 admin-rbac.spec.js）
```

**测试 super_admin 账号**：staging 由运维 SQL 种子建（`INSERT user_role(user_id=1, role_code='super_admin')`）后给文档维护人。

---

## 10. 当前进行中

**登录认证（user-auth）— P1 实施期**

主文档：`docs/user-auth-impl.md`（v2 2026-05-25 重写；删 BYPASS_AUTH、`pc_*` → `fab.pc.*` 迁移、Login 启用注册、role-based admin gating、SettingsSecurity 独立路由 等）

**v2 边界**：Profile 富字段真实切换、PcDangerZone（数据导出 / 注销账号）、Admin 用户资料编辑 / 头像审核**不在本期**，归 user-info 模块（占位 `../docs/design/user-info/01-architecture.md`）。本期 Admin Console 只做 auth 运营面（用户列表 / 封禁 / 角色 / 强制下线 / 登录审计）。

**注意**：P4 阶段会大改 `views/Admin.vue` 和 `components/admin/*` —— 现有 Stream / Alert / Tickets 表是 mock，要替换为真接口（`/admin/users` / `/admin/audit/login-events`）。改动量大，必须严格 TDD。

---

## 11. 当前已知问题

**user-auth P1 必修**：

1. `stores/user.js` 用 `pc_token` / `pc_userInfo`——改 `fab.pc.*` 命名空间 + 自动迁移
2. `utils/axios.js` + `router/index.js` 含 `BYPASS_AUTH` debug flag——必须删
3. `views/Login.vue` 注册按钮是 toast「联系运营」——P1 启用注册流程
4. `isAdmin: s => s.userInfo?.role === 'admin'`——改 `roles[]` 数组判断

**user-auth P4 必修（admin auth 运营面）**：

5. `views/Admin.vue` 内 Stream / Alert / Tickets 表是 mock——P4 接 `/admin/users` / `/admin/audit/login-events`（auth 运营面）

**延期到 user-info 模块**（占位 `../docs/design/user-info/01-architecture.md`）：

6. `views/Profile.vue` 大量 fixture 字段——本期保留 fixture + 登录返回的 nickname/avatar 软兜底；真实字段切换归 user-info
7. Admin 用户资料编辑 / 头像审核 UI——归 user-info 模块运营面

---

## 12. AI 协作守则总结

✅ **必做**：
- 写代码前先列测试清单 + 写第一个测试 + 跑红
- 改双端共享文件时**同步更新** Web 端对应文件
- Admin / RBAC 改动必须双层校验（前端 v-if + 服务端 role 检查）
- i18n 任何文案变更立刻同步 EN
- token 必须走 CSS variable

❌ **不做**：
- 不要在 views 内直接 import axios
- 不要硬编码 CJK / 颜色 / 数值字号
- 不要在业务层覆盖 Element 默认样式（必须包薄壳）
- 不要把 admin 组件混在 `components/` 根目录（必须 `components/admin/`）
- 不要写 console.log 进 admin 代码
- 不要跳过 TDD

---

## 13. 关键引用

- 父规范：`../CLAUDE.md`
- Web 端 CLAUDE.md（双端共享部分）：`../fab-3d-world-web/CLAUDE.md`
- 总体方案：`../docs/design/user-auth/01-architecture.md`
- 后端契约：`../fab-3d-world-api/docs/user-auth-impl.md`
- PC 实施：`docs/user-auth-impl.md`
- I18N：`../I18N_PLAN.md`
- 设计 token：`../packages/design-tokens/tokens.css`
- 全局测试规范：`~/.claude/rules/common/testing.md`
- Vue 3 文档：<https://vuejs.org/>
- Element Plus：<https://element-plus.org/>
- Vitest：<https://vitest.dev/>
- Playwright：<https://playwright.dev/>
