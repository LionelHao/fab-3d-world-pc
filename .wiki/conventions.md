# Conventions — fab-3d-world-pc

> 速查约定（user-auth P1-P6 落地后版本）。
> 父规范：`../CLAUDE.md` + `CLAUDE.md` + `../docs/testing-templates.md` + `../docs/design-system.md`。
> 同源对等：`../fab-3d-world-web/.wiki/conventions.md`。

---

## 1. Vue 3 SFC 强制规范

✅ 必须：
- 全部用 `<script setup>` + Composition API（**禁 Options API**）
- 单文件 ≤ 400 行；函数 ≤ 50 行；嵌套 ≤ 4 层
- 公共 props 用 `defineProps({ x: { type, default } })`；事件用 `defineEmits([...])`
- 双向绑定优先 `defineModel`（Vue 3.4+）或 `v-model:xxx` + `props/emit`

❌ 禁止：
- Options API（data/methods 写法）
- 在 `<script setup>` 外写业务逻辑（util 除外）
- `import { ElXxx } from 'element-plus'` 出现在业务组件（chrome 级例外）

## 2. Element Plus 薄壳模式

✅ **必须**：
- 业务通过 `components/ui/Ui*.vue` 薄壳暴露 Element 输入组件（UiInput / UiButton / UiFormField...）
- Element locale 走根 `<el-config-provider :locale="localeStore.elLocale">`，业务层不重复
- ElMessage / ElNotification / ElMessageBox / ElPopconfirm 入参文案必须 `t()`
- 表格分页 `v-model:current-page="page"` `:page-size="PAGE_SIZE"` `@current-change`
- Dialog `destroy-on-close` + `:close-on-click-modal="false"`（防误关）

❌ **禁止**：
- 业务 SFC 直接 `import { ElDialog } from 'element-plus'`（dialog 必须包薄壳或写在 admin/mfa/captcha 子目录里作为「可命名 chrome」）
- 业务层覆盖 Element 默认主题色（必须 token 覆盖在 `style.css` 全局）
- ElDialog 嵌套 > 1 层
- el-table 大数据集不开虚拟滚动（>100 行必用）

> 例外 chrome 级（允许直接 import Element）：`Admin*.vue` `Mfa*Dialog.vue` `CaptchaWidget.vue` `SettingsSecurity.vue`（已声明为「page chrome」）。

## 3. 组件目录与命名

| 类型 | 目录 | 命名规则 | 例 |
|---|---|---|---|
| PC chrome | `components/` 根 | `Pc*` | `PcNavbar` / `PcFooter` / `PcSessionList` |
| ui primitive | `components/ui/` | `Ui*` | `UiInput` / `UiButton` / `UiFormField` |
| **Admin Ops Console** | `components/admin/` | **`Admin*`** | `AdminUserMgmt` / `AdminAuditTable` / `AdminBanDialog` |
| **MFA 两步验证** | `components/mfa/` | **`Mfa*Dialog`** | `MfaSetupDialog` / `MfaVerifyDialog` / `MfaDisableDialog` / `MfaRecoveryRegenDialog` |
| **Captcha** | `components/captcha/` | `Captcha*` | `CaptchaWidget` |
| Settings 子件 | `components/settings/` | `Pc*` | `PcSessionList` |
| Auth 子流程 | `components/auth/` | `ForgotStep*` | 三步组件 |
| Home / Profile section | `components/home/` `components/profile/` | `Pc*` | 视觉壳 |
| View | `views/` | 业务名 PascalCase | `Login` / `SettingsSecurity` / `Admin` |
| Store getter | — | `is*` / `has*` / `can*` 前缀 | `isAdmin` / `hasRole` / `isVerifiedUser` |
| Service 函数 | `service/` | 动词开头 camelCase | `listUsers` / `banUser` / `loginMfaVerify` |
| Composable | `utils/` 或 `composables/` | `use<Feature>` | `useCountdown` |
| Constants | UPPER_SNAKE | — | `PAGE_SIZE` / `OAUTH_PROVIDERS` / `ALL_ROLES` |
| 测试 | `*.spec.js` / `*.test.js` | 同文件名 | `Login.spec.js` |

## 4. Admin / RBAC 双层守卫（user-auth P4 硬性）

| 层 | 实现 | 作用 |
|---|---|---|
| L1 客户端守卫 | `router.beforeEach` `meta.requiresRoles: ['admin','super_admin']` + ElMessage 跳转 | UX：未授权用户立即看到「无权访问」提示 + 自动跳 /home |
| L2 客户端 v-if | `v-if="userStore.isSuperAdmin"` / `userStore.hasRole('moderator')` | UX：隐藏不可用按钮（角色编辑入口 / Roles 子 tab / Danger Zone） |
| **L3 服务端校验** | **Gateway SaToken filter + StpInterface.getRoleList** | **真实安全边界 — 不可信赖前端** |

**永远不**只靠前端守卫做权限控制。L1+L2 被绕过时，L3 必须返 401/403，axios 拦截器自动 logout。

危险操作（封禁 / 角色 / 强制下线 / 解绑 OAuth / 关 MFA）必须走 `ElMessageBox.confirm({type:'warning'})` 或 `ElPopconfirm` 二次确认。

## 5. Pinia store

- 命名空间常量 `NS = 'fab.pc'`（与 web 的 `fab.web` 双端互斥）
- 三 key：`fab.pc.token` / `fab.pc.user` / `fab.pc.expireAt`
- legacy 迁移：首次启动一次性把 `pc_token` / `pc_userInfo` → `fab.pc.*` 并删旧 key
- **immutable update**：`setBindings` 必须 spread `{...user, bindings}`，禁直接 `user.bindings.push(...)`
- getters 必须用箭头函数 `(s) => ...` 或带 `(s) => (arg) => ...` 返回函数模式（hasRole / hasAnyRole 是 factory getter）

## 6. axios / Service 层

- baseURL = `import.meta.env.VITE_API_BASE_URL`
- DEVICE_TYPE='pc' 注入 `X-Device-Type` header
- 业务全走 `service/<module>.js`，**views 内禁 `import axios`**
- service 函数命名 = 动词开头 + 业务名（`loginByPassword` / `listUsers` / `revokeAllSessions`）
- service/auth.js 暴露的端点必须有 JSDoc 注释段「命名 vs URL 对照」
- admin 模块 service 函数集中 `service/admin.js`，方便一处 RBAC review

## 7. Design Tokens（Paper-CAD 严格）

✅ **必须**：
- 所有圆角用 token：`var(--radius-none)` / `var(--radius-2)` / `var(--radius-4)` / `var(--radius-32)` / `50%`
- 所有字号用 token：`var(--text-9)` / `--text-10` / `--text-11` / `--text-12` / `--text-13` / `--text-18` …
- 所有 spacing 用 token：`var(--space-N)`
- 所有颜色用 token：`var(--ink)` / `--ink-2` / `--ink-3` / `--paper)` / `--paper-2/3` / `--hilite` / `--accent-link` / `--semantic-warning/success`
- 字体族用 token：`var(--f-mono)` / `var(--f-cond)`
- focus ring 用 `box-shadow: var(--glow-accent-ring)`

❌ **禁止**（高频违规）：
- 字号硬编码 `font-size: 14px`（必须 `var(--text-12)`）
- 圆角 `8 / 12 / 16 / 999px`（合法只有 `0 / 2 / 4 / 32 / 50%`）
- 字体 Inter / Roboto / system-ui / Arial / Open Sans / Space Grotesk / JetBrains Mono
- 颜色 `#FF6B1A` 橙 / `#2284E6` 蓝 / 任何 dark-mode 残留 / 紫色渐变
- 阴影 `rgba(0,0,0,0.3+)` 暗投影 / shadow-xl
- Vant / Element 默认主题色直接暴露

完整规范：`../docs/design-system.md`。

## 8. I18N 规范

- 任何 user-facing 文案必须 `t('namespace.key')`，**禁硬编码 CJK**
- ElMessage / ElNotification / ElMessageBox 入参必须 `t()`，禁 `ElMessage.info('提示')` 中文
- locale 文件：`src/locales/<locale>/<namespace>.json`
- 当前 PC 10 个 namespace（admin / auth / common / goodsDetail / home / login / market / postDetail / profile / settings），双端 mirror
- **双端 i18n key 严格 mirror**：PC 新增 `settings.security.password.*` 必须同步 web；反之亦然
- 提交前 `node ../scripts/check-i18n-parity.mjs` 全过
- 切 locale：`useLocaleStore().setLocale(name)` 内联调用 `i18n.global.locale.value = name`

详细规则：`../I18N_PLAN.md`。

## 9. TDD 强制（双端硬性，PC 增强 admin / RBAC）

- RED → GREEN → REFACTOR 节奏（父 `../CLAUDE.md §5`）
- 覆盖率门禁：`line ≥ 80%`；**admin / mfa 模块 ≥ 85%**（敏感操作）
- 反向用例六类穷举：happy / null / 边界 / 非法字符 / 并发 / 限流
- **Admin / RBAC 改动必须配套 E2E**：
  - non-admin 访问 `/admin` → 跳 `/home` ✅
  - admin 访问 `/admin` → 正常加载 ✅
  - super_admin 看到角色编辑入口；admin 看不到 ✅
  - E2E 模板：`tests/e2e/admin-rbac.spec.js`
- 跳测试的 commit 必须注 `[tdd-skip: <reason>]`，仅限纯样式 / 文档 / locale / 依赖版本升级
- 测试栈：Vitest + @vitest/coverage-v8 + Playwright（chromium-desktop 1440×900） + @vue/test-utils + axios-mock-adapter

## 10. 安全硬性条款（PC 独有强化）

继承 Web 端全部 +：

- ❌ 业务层硬编码 admin 凭据（即使是 staging）
- ❌ 前端单纯靠 `v-if` 控制 admin 入口而无服务端校验
- ❌ 生产环境保留 `BYPASS_AUTH` flag（user-auth P1 已删，禁回潮）
- ❌ MFA / 改密 表单的 password / TOTP code 走 console.log
- ✅ Admin 危险操作必须 `ElMessageBox.confirm({type:'warning'})` 二次确认
- ✅ Admin 操作走标准 service 接口（后端会记 user_login_event）
- ✅ `console.log` 在 admin / mfa 模块**完全禁止**

提交前自检：

```bash
grep -rn "console.log\|console.debug" src/components/{admin,mfa}/   # 必须零结果
grep -rn "BYPASS_AUTH" src/                                          # 必须零结果
grep -rn "pc_token\|pc_userInfo" src/                                # 应在 store migrateLegacy 外零结果
```

## 11. 性能要点

- ElTable 大数据用虚拟滚动（`row-key` + `v-loading`）；> 100 行强制
- Admin Console 子 pane 用 `v-if="activePane === 'users'"` 切换，避免一次性全 import（详 Admin.vue:87）
- ElDialog 关闭 `destroy-on-close`（防 DOM 残留 + 表单状态保留）
- 路由懒加载默认（`() => import('@/views/...')`）
- 视口 ≥ 1920px content 居中 1440px 不拉伸（admin-page 用 min-width:1440px 锁死）

## 12. 双端同源副本清单（PC ↔ Web 必同步）

| 文件 | 唯一差异 |
|---|---|
| `utils/axios.js` | DEVICE_TYPE='pc' + ElMessage toast 通道 + 命名空间 `fab.pc.*` |
| `utils/viewerSoul.js` | — 完全相同 |
| `utils/countdown.js` | — 完全相同 |
| `utils/passwordPolicy.js` | — 完全相同（P3 从 web port） |
| `components/ui/UiReveal.vue` | — 完全相同 |
| `i18n/index.js` + `i18n/detect.js` | — 完全相同 |
| `stores/locale.js` | — 完全相同 |
| `stores/user.js` | 命名空间常量 NS = 'fab.pc'（web 用 'fab.web'）；legacy 迁移 key 不同（pc_token vs web_token） |
| `scripts/gen-api-types.mjs` | — 完全相同 |
| `service/auth.js` 命名/URL 对照表 | endpoint 全一致；PC 不暴露 wechat-mp，web 不暴露 admin |
| `service/{mfa,captcha,security,user}.js` | — 完全相同 |
| `tests/e2e/<auth-flow>.spec.js` | 元素 selector 不同（pc data-test 命名 ss-* / adm-* / mfa-* / oauth-*） |

**改 PC 同源副本时必须同步 web**；漂移即视为 bug。

## 13. Git Commit（PC 端 scope 习惯）

- `feat(pc): ...` — 通用
- `feat(pc/auth): ...` — user-auth 域
- `feat(pc/admin): ...` — Admin Console
- `feat(pc/mfa): ...` — 两步验证
- `feat(pc/oauth): ...` — OAuth 绑定 / 登录
- `feat(pc/captcha): ...` — 人机验证
- `test(pc): ...` — 测试
- `refactor(pc): ...` — 重构

提交描述末尾若走 TDD 流程加 `[tdd-pass]`；跳测试加 `[tdd-skip: <reason>]`。

## 14. 提交前 checklist

- [ ] `npm run test:run` 全绿（Vitest 单测）
- [ ] `npm run test:coverage` line ≥ 80% / admin ≥ 85% / mfa ≥ 85%
- [ ] `npm run test:e2e` chromium-desktop golden path 通过
- [ ] `npm run dev` 看一眼视觉（admin 变更必须打开 `/admin` 看；MFA 变更必须打开 `/settings/security` 看）
- [ ] `node ../scripts/check-i18n-parity.mjs` 全过
- [ ] `grep -rn "console.log" src/components/{admin,mfa}/` 零结果
- [ ] 双端同源文件改动 → web 仓同步 PR
