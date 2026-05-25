# Cross-Repo — fab-3d-world-pc

> 调用 fab-3d-world-api 哪些 endpoint + 调用点 path:line 索引。
> 真相源：`../../fab-3d-world-api/docs/openapi.yaml`（通过 `npm run gen:api` 拉到本仓 `src/api/types.ts`）。
> **状态**：Step 4 骨架版，AI 后续增量补全。

---

## 1. service 文件 → 后端 endpoint 映射

| service 文件 | 对应后端 prefix | 主要调用 |
|---|---|---|
| `service/auth.js` | `/auth/**` | login / signup / refresh / oauth |
| `service/user.js` | `/user/**` | me / devices |
| `service/admin.js` | ★ `/admin/**` | listUsers / banUser / setRoles / listLoginEvents / forceLogout |
| `service/goods.js` | `/trade/goods/**` | 商品列表 / 详情 |
| `service/content.js` | `/content/**` | 首页内容 / 推荐 |
| `service/model.js` | `/model/**` | 3D 模型元数据 |

---

## 2. PC 独占 endpoint（admin/**）

| Endpoint | 调用方 | RBAC |
|---|---|---|
| `GET /admin/users` | `views/Admin.vue` → `service/admin.js` listUsers | admin / super_admin |
| `POST /admin/users/{id}/ban` | AdminUserMgmt → banUser | admin / super_admin |
| `POST /admin/users/{id}/unban` | AdminUserMgmt → unbanUser | admin / super_admin |
| `POST /admin/users/{id}/roles` | AdminUserMgmt → setRoles | **super_admin only** |
| `GET /admin/audit/login-events` | AdminAudit → listLoginEvents | admin / moderator / super_admin |
| `DELETE /admin/devices/{id}` | AdminUserMgmt → forceLogout | admin / super_admin |

> ⚠ Web 端**不应**调用 `/admin/**` 任何 endpoint；如果出现，是逻辑泄漏 bug，应迁到 PC。

---

## 3. 调用点 path:line 索引（待 AI 增量补全）

格式：`<endpoint> ← <view>:<line> via <service-fn>`

- TODO: `POST /auth/login/password` ← `Login.vue:?` via `loginByPassword`
- TODO: `GET /admin/users` ← `Admin.vue:?` via `listUsers`
- TODO: `POST /admin/users/{id}/ban` ← `admin/AdminUserMgmt.vue:?` via `banUser`
- TODO: `GET /admin/audit/login-events` ← `admin/AdminAudit.vue:?` via `listLoginEvents`
- TODO: ...

AI 触发 "更新 wiki" 时应 grep `src/views/*.vue` + `src/components/admin/*.vue` 中 `import { x } from '@/service/y'`。

---

## 4. utils/axios.js 的 PC 特有处理

- DEVICE_TYPE='pc' 在请求 header `X-Device-Type` 注入（后端审计 + 限流分群依据）
- 命名空间 `fab.pc.*`（区别于 web 的 `fab.web.*`）
- 其余拦截器逻辑（refresh / login auto-store / 419-401 / envelope）与 web 一致

---

## 5. Breaking change watch list（PC 独有）

后端改下列内容时 PC 仓**必须**联动改：

- [ ] `/admin/**` response schema 字段变更 → AdminUserMgmt / AdminAudit 表格列定义 + admin.json i18n
- [ ] 角色枚举值变更（admin / super_admin / moderator）→ stores/user.js `hasRole` 调用方 + admin v-if 条件
- [ ] `user.roles` 数组结构变更 → stores/user.js `isAdmin` getter + router 守卫
- [ ] `/admin/audit/login-events` 字段（device / ip / failureReason）→ AdminAudit 表格 + filter

---

Last reviewed: 2026-05-25 (Step 4 骨架)
