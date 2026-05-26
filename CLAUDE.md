# fab-3d-world-pc — Claude 协作规范（桌面 + Ops Console）

> 父规范：`../CLAUDE.md`（**先读**）+ `../ARCHITECTURE.md`（跨仓拓扑）。本文档是 PC 端独有强化条款。
> Wiki：`.wiki/{modules,entities,flows,cross-repo,conventions}.md`，AI 半自动维护。
> 同源对等：`../fab-3d-world-web/CLAUDE.md`（双端共用 primitive / I18N / design token / TDD）。

---

## 0. 子项目快照

| 维度 | 选型 |
|---|---|
| 框架 | **Vue 3.5+** Composition API + `<script setup>`（禁 Options API） |
| 构建 | Vite 5.x |
| 状态 | Pinia 2.x（命名空间 **`fab.pc.*`**） |
| UI 组件库 | **Element Plus 2.x**（ElTable / ElDialog / ElForm 为主，经 `ui/` 薄壳调用） |
| 3D | online-3d-viewer + three.js（Phase 4 接入，用 `utils/viewerSoul.js`） |
| 动画 | motion-v 2.2.1 |
| HTTP | axios 1.x + `utils/axios.js` |
| 国际化 | vue-i18n 11 + `<el-config-provider :locale>` 包根 |
| 测试 | Vitest + @vitest/coverage-v8 + Playwright |

- **独立 git repo**：`LionelHao/fab-3d-world-pc`（main）
- 目录结构 / 8 views / Pc-* + Admin-* primitive 31 件套 → `.wiki/modules.md`

### 关键差异于 Web

| 维度 | Web | PC |
|---|---|---|
| 形态 | 移动 H5（375-414px） | 桌面（1200-1920px） |
| UI 库 | Vant | **Element Plus** |
| storage namespace | `fab.web.*` | **`fab.pc.*`** |
| X-Device-Type | `web` | **`pc`** |
| Admin 入口 | 无 | **`/admin`（仅 admin/super_admin）** |
| OAuth provider 偏好 | 移动微信 / Apple | 桌面 Google / GitHub / Apple |

### 双端同源副本（改 pc 必同步 web）

`utils/axios.js` · `utils/viewerSoul.js` · `components/ui/UiReveal.vue` · `i18n/index.js` · `i18n/detect.js` · `stores/locale.js` · `stores/user.js` · `scripts/gen-api-types.mjs`

---

## 0.5 SDD 协议（2026-05-26 起 mandatory）

> 5 分钟版：`../docs/sdd/SDD-PROTOCOL.md`

**改/加任何 views / service / store / components/admin 必须**：

```vue
<script setup>
/**
 * <短描述>
 *
 * @spec docs/design/<module>/01-architecture.md#<section>
 * @capability <module>.<feature-slug>
 * @ac AC-PX.Y
 */
import { ref } from 'vue'
</script>
```

```js
/**
 * @spec docs/design/<module>/01-architecture.md#<section>
 * @capability <module>.<feature-slug>
 */
import axios from '@/utils/axios'
```

**Admin / RBAC 改动额外**：
- capability tier 必须 `critical`
- 关联测试方法上方 `// @validates AC-P4.X`
- 双层校验：前端 v-if 是 UX，服务端 role 校验是真边界

**配套强制流**：
- 新跨模块决策 → 开 ADR（`../docs/adr/_template.md`）
- 新能力 → 建 capability yaml（`../docs/reference/capabilities/_template.md`）
- PR 模板 §1 必填 Spec / Capability / AC 字段
- CI 自动跑 `scripts/sdd/check-anchors-shallow.mjs`
- 本地跑全检：`cd .. && node scripts/sdd/check-anchor-integrity.mjs --repo fab-3d-world-pc`
- `npm run gen:api` 内置 breaking-change guard（Phase F）

---

## 1. 编码核心要点

> 完整 Vue 3 / Element Plus / 命名 / 安全 / 性能 → `.wiki/conventions.md`。

### 1.1 Element Plus 使用

✅ **必须**：
- 通过 `components/ui/` 薄壳调用 Element 组件（除 chrome 级）
- Element locale 走 `<el-config-provider :locale>`（App.vue 已配，业务不重复）
- ElMessage / ElNotification / ElMessageBox 入参文案必须 `t()`
- 表格分页 `v-model:current-page` / `:page-size`

❌ **禁止**：
- 业务组件内直接 `import { ElXxx }` 不经薄壳（除已是 chrome 级）
- 业务层覆盖 Element 默认主题色（必须 token 覆盖在全局 style.css）
- ElDialog 嵌套 > 1 层

### 1.2 Admin / Ops Console

- **所有 Admin 组件**放 `components/admin/`，命名 `Admin*`
- `/admin` 路由必须 `meta.requiresAuth: true` + `meta.requiresRoles: ['admin', 'super_admin']`
- **双层校验**：前端 v-if 是 UX，后端必须再校验权限（不可信赖前端）
- 危险操作（封禁 / 角色 / 删除）必须 `ElMessageBox.confirm` 二次确认
- 角色编辑入口**仅** super_admin 可见：`v-if="userStore.hasRole('super_admin')"`
- Admin 表格必备：分页 + 过滤 + 排序 + 批量选中

---

## 2. 路由 / 守卫 / RBAC

### 2.1 双层守卫

1. **客户端守卫**（`router.beforeEach`）— UX 跳转，提前拦截
2. **服务端守卫**（gateway SaToken filter）— 真正的安全边界

**永远不**只靠前端守卫做权限控制。

### 2.2 角色枚举

| role | 描述 | UI 影响 |
|---|---|---|
| `user` | 普通用户 | 可看 profile，不进 admin |
| `verified_user` | 双因素已验证 | 解锁高级操作 |
| `creator` | 已上传 ≥1 模型 | 可发布 / 编辑作品 |
| `moderator` | 审核员 | `/admin` 部分入口（审计 / 内容审核） |
| `admin` | 平台运营 | `/admin` 全入口 |
| `super_admin` | 平台所有者 | + 角色管理 / 系统设置 |

---

## 3. I18N 速查

- 任何 user-facing 文案必须 `t('namespace.key')`，**禁硬编码 CJK**
- ElMessage 入参必须 `t()`，禁 `ElMessage.info('xxx')` 中文
- PC 当前 8 个 namespace（home / market / postDetail / goodsDetail / profile / admin / login / common）
- 完整规范：`../I18N_PLAN.md` + `.wiki/conventions.md` §3

提交前 `node ../scripts/check-i18n-parity.mjs` 全过。

---

## 4. API 类型 codegen

同 web。`npm run gen:api` 拉 OpenAPI → 生 `src/api/types.ts`。完整使用模式见 `docs/api-types.md`。

---

## 5. TDD —— 强制开发流程（PC 版）

> 父 `../CLAUDE.md §5` + 详细模板 `../docs/testing-templates.md`。

### 5.1 工具链

同 Web 端：Vitest + coverage-v8 + Playwright + @vue/test-utils + axios-mock-adapter。

### 5.2 Admin / RBAC 必备测试

**所有 admin 路由 / 组件改动必须配套**：

- ✅ E2E：non-admin 访问 `/admin` → 跳 `/home`
- ✅ E2E：admin 访问 `/admin` → 正常加载
- ✅ E2E：super_admin 看到角色编辑入口；admin 看不到
- ✅ 单测：`userStore.isAdmin` / `userStore.hasRole('xxx')` 在各 role 组合下返回值

模板见 `../docs/testing-templates.md` §3.3。

### 5.3 覆盖率门禁

`LINE ≥ 80%`；admin 模块单独要求 `LINE ≥ 85%`（敏感操作）。

### 5.4 AI 编码自检

同 Web：写任何业务代码前先列测试清单 + 写第一个测试跑红。Admin / RBAC 改动额外要求 E2E `admin-rbac.spec.js` 跑通。

跳测试的 commit 注 `[tdd-skip: <reason>]`，仅限纯样式 / 文档 / locale / 依赖升级。

---

## 6. 安全硬性条款（PC 独有）

继承 Web 端所有条款 + PC 独有：

- ❌ 业务层硬编码 admin 凭据（即使为 staging）
- ❌ 前端单纯靠 `v-if` 控制 admin 入口而无服务端校验
- ❌ 生产环境保留 `BYPASS_AUTH` flag
- ✅ Admin 危险操作必须 `ElMessageBox.confirm` 二次确认
- ✅ Admin 操作走标准 service 接口（后端会记 user_login_event）
- ✅ `console.log` 在 admin 模块**完全禁止**

提交前自检：

```bash
grep -rn "console.log\|console.debug" src/components/admin/   # 必须零结果
grep -rn "BYPASS_AUTH" src/                                    # 必须零结果
grep -rn "pc_token\|pc_userInfo" src/                          # 应在 store migrateLegacy 外零结果
```

---

## 7. 提交规范

- Conventional Commits 中文描述 ≤50 字
- scope：`pc` / `pc/admin` / `pc/profile` 等
- 提交前必须：
  - [ ] `npm run test:run` 全绿
  - [ ] `npm run test:coverage` 覆盖率不掉
  - [ ] `npm run dev` 看一眼视觉（admin 变更必须打开 `/admin` 看一眼）
  - [ ] `node ../scripts/check-i18n-parity.mjs` 全过

---

## 8. dev 启动 / 联调

```bash
# 1. 起后端 + 依赖
cd ../fab-3d-world-api/docker && docker compose up -d
cd ../ && mvn -pl fab-3d-world-gateway,fab-3d-world-auth,fab-3d-world-user,fab-3d-world-admin -am spring-boot:run

# 2. 起前端
cd ../../fab-3d-world-pc
cp .env.example .env.development.local
npm install
npm run dev                              # http://localhost:5174

# 3. 跑测试
npm run test
npm run test:e2e
```

**测试 super_admin 账号**：staging 由运维 SQL 种子建（`INSERT user_role(user_id=1, role_code='super_admin')`）。

---

## 9. 当前进行中

**登录认证（user-auth）— P1 实施期**

- 实施手册：`docs/user-auth-impl.md`（v2 2026-05-25：删 BYPASS_AUTH / `pc_*` → `fab.pc.*` 迁移 / 启用注册 / role-based admin gating / SettingsSecurity 独立路由）
- v2 边界：Profile 富字段真实切换 / PcDangerZone / Admin 用户资料编辑**不在本期**（归 user-info）。本期 Admin Console 只做 auth 运营面（用户列表 / 封禁 / 角色 / 强制下线 / 登录审计）
- P4 注意：`views/Admin.vue` 和 `components/admin/*` 现有 Stream / Alert / Tickets 表是 mock，要替换为真接口（`/admin/users` / `/admin/audit/login-events`）

### 已知问题（P1 必修）

1. `stores/user.js` 用 `pc_token` / `pc_userInfo` → 改 `fab.pc.*` 命名空间 + 自动迁移
2. `utils/axios.js` + `router/index.js` 含 `BYPASS_AUTH` debug flag → 必须删
3. `views/Login.vue` 注册按钮是 toast「联系运营」→ P1 启用注册流程
4. `isAdmin: s => s.userInfo?.role === 'admin'` → 改 `roles[]` 数组判断

### P4 必修（admin auth 运营面）

5. `views/Admin.vue` 内 Stream / Alert / Tickets 表是 mock → 接 `/admin/users` / `/admin/audit/login-events`

### 延期（user-info 模块）

6. `views/Profile.vue` fixture → 本期保留 + 登录返回 nickname/avatar 软兜底
7. Admin 用户资料编辑 / 头像审核 UI → 归 user-info 模块运营面

---

## 10. AI 协作守则速查

✅ **必做**：
- 写代码前先列测试清单 + 写第一个测试 + 跑红
- 改双端同源文件时**同步更新** Web 端
- Admin / RBAC 改动必须双层校验（前端 v-if + 服务端 role 检查）
- i18n 任何文案变更立刻同步 EN
- token 必须走 CSS variable

❌ **不做**：
- views 内直接 `import axios`
- 硬编码 CJK / 颜色 / 数值字号
- 业务层覆盖 Element 默认样式（必须包薄壳）
- admin 组件混在 `components/` 根目录（必须 `components/admin/`）
- console.log 进 admin 代码
- 跳过 TDD

---

## 11. 关键引用

- 父规范：`../CLAUDE.md` · `../ARCHITECTURE.md`
- 同端对等：`../fab-3d-world-web/CLAUDE.md`
- Wiki：`.wiki/{modules,entities,flows,cross-repo,conventions}.md`
- API 类型：`docs/api-types.md`
- 用户认证：`../docs/design/user-auth/01-architecture.md` + `docs/user-auth-impl.md`
- I18N：`../I18N_PLAN.md`
- Design tokens：`../packages/design-tokens/tokens.css` + `../docs/design-system.md`
- 测试模板：`../docs/testing-templates.md`
- 全局测试规范：`~/.claude/rules/common/testing.md`
- Vue 3：<https://vuejs.org/> · Element Plus：<https://element-plus.org/> · Vitest：<https://vitest.dev/> · Playwright：<https://playwright.dev/>
