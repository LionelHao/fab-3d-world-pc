# Cross-Repo — fab-3d-world-pc

> 调用 fab-3d-world-api 的全部 endpoint + 调用点 path:line 索引。
> 真相源（前端）：`src/service/{auth,mfa,captcha,security,admin,user,goods,content,model}.js`。
> 真相源（后端）：`../fab-3d-world-api/.wiki/cross-repo.md` §1。

---

## 1. service 文件 → 后端 endpoint 总览

| service 文件 | 后端 prefix | 端点数 | RBAC 要求 |
|---|---|---|---|
| `service/auth.js` | `/auth/**` + `/auth/oauth/**` | 17 | 公开 / 登录 / 部分需 login |
| `service/mfa.js` | `/mfa/**` | 6 | 全部需登录 |
| `service/captcha.js` | `/captcha/**` | 2 | 公开 |
| `service/security.js` | `/user/security/**` | 2 | 登录 |
| `service/admin.js` | `/admin/**` | 11 | **admin / moderator / super_admin** |
| `service/user.js` | `/user/info` | 1 | 登录 |
| `service/goods.js` | `/trade/goods/**` `/trade/categories` | 4 | 公开 |
| `service/content.js` | `/content/posts/**` | 2 | 公开 |
| `service/model.js` | `/model/**` | 2 | 登录 |

---

## 2. /auth/** 端点 × 调用点（user-auth P1-P6 主体）

| Method | Path | service fn | 调用点 | P 阶段 |
|---|---|---|---|---|
| POST | `/auth/login/password` | `loginByPassword` | `src/views/Login.vue:155` | P1 + P6 |
| POST | `/auth/login/code` | `loginByCode` | （未在 view 直接调，预留） | P1 |
| **POST** | **`/auth/login/mfa-verify`** | **`loginMfaVerify`** | `src/views/Login.vue:96` | **P6** |
| POST | `/auth/signup` | `register` | （Login 当前 toast 占位，未连） | P1 |
| POST | `/auth/logout` | `logout` | `src/views/SettingsSecurity.vue:199` | P3 |
| POST | `/auth/refresh` | `refresh` | `src/utils/axios.js:59`（拦截器自动） | P1 |
| POST | `/auth/sms/send` | `sendSms` | （备用，Login mock 倒计时） | P1 |
| POST | `/auth/email/send` | `sendEmail` | — | P1 |
| POST | `/auth/password/change` | `changePassword` | `src/views/SettingsSecurity.vue:196` | P3 |
| POST | `/auth/password/reset/request` | `requestPasswordReset` | `src/views/ForgotPassword.vue:70` | P2 |
| POST | `/auth/password/reset/confirm` | `confirmPasswordReset` | `src/views/ForgotPassword.vue:106` | P2 |
| GET | `/auth/sessions` | `listSessions` | `src/views/SettingsSecurity.vue:93` | P3 |
| POST | `/auth/sessions/{token}/revoke` | `revokeSession` | `src/views/SettingsSecurity.vue:105` | P3 |
| POST | `/auth/sessions/revoke-others` | `revokeOtherSessions` | `src/views/SettingsSecurity.vue:115` | P3 |

## 3. /auth/oauth/** 端点 × 调用点（user-auth P5）

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| GET | `/auth/oauth/{provider}/authorize` | `oauthAuthorize` | `src/views/Login.vue:208` + `src/views/SettingsSecurity.vue:234` |
| POST | `/auth/oauth/{provider}/callback` | `oauthCallback` | `src/views/OAuthCallback.vue:59` |
| POST | `/auth/oauth/{provider}/bind` | `oauthBind` | `src/views/OAuthCallback.vue:50`（action=bind 分支） |
| DELETE | `/auth/oauth/{provider}` | `oauthUnbind` | `src/views/SettingsSecurity.vue:251` |

**PC providers**: `google` / `github` / `apple`（**不含 wechat-mp**，per impl §0.3 — PC 偏桌面 provider）。

## 4. /mfa/** 端点 × 调用点（user-auth P6）

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| POST | `/mfa/setup` | `setup` | `src/components/mfa/MfaSetupDialog.vue:53` |
| POST | `/mfa/verify-setup` | `verifySetup` | `src/components/mfa/MfaSetupDialog.vue:71` |
| POST | `/mfa/verify` | `verify` | `src/components/mfa/MfaVerifyDialog.vue:44`（通用敏感操作前调） |
| POST | `/mfa/disable` | `disable` | `src/components/mfa/MfaDisableDialog.vue`（密码 + TOTP 双重） |
| GET | `/mfa/status` | `status` | `src/views/SettingsSecurity.vue:272` |
| POST | `/mfa/recovery-codes` | `regenerateRecoveryCodes` | `src/components/mfa/MfaRecoveryRegenDialog.vue` |

## 5. /captcha/** 端点 × 调用点（user-auth P6）

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| GET | `/captcha/config?scene=login` | `getConfig` | `src/views/Login.vue:43`（`onMounted` 拉一次）+ Login.vue:167（失败后强制开启） |
| POST | `/captcha/verify` | `verify` | （留接 — 当前 mock provider 在前端直接 emit token，无独立校验调用） |

## 6. /user/security/** 端点 × 调用点（user-auth P6 安全预警）

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| GET | `/user/security/alerts` | `listAlerts` | `src/views/SettingsSecurity.vue:312`（onMounted 拉） |
| POST | `/user/security/alerts/{id}/ack` | `acknowledgeAlert` | （已声明，未在 view 调，预留 ack UI 入口） |

## 7. /admin/** 端点 × 调用点（user-auth P4 — **PC 独占**）

| Method | Path | service fn | 调用点 | RBAC |
|---|---|---|---|---|
| GET | `/admin/dashboard` | `getDashboard` | `src/views/Admin.vue:97` | admin/super |
| GET | `/admin/users` | `listUsers` | `src/components/admin/AdminUserMgmt.vue:83` | admin/super |
| GET | `/admin/users/{id}` | `getUserDetail` | `src/components/admin/AdminUserMgmt.vue:131` | admin/super |
| PUT | `/admin/users/{id}/ban` | `banUser` | `src/components/admin/AdminUserMgmt.vue:164` | admin/super |
| PUT | `/admin/users/{id}/unban` | `unbanUser` | `src/components/admin/AdminUserMgmt.vue:183` | admin/super |
| PUT | `/admin/users/{id}/roles` | `setUserRoles` | `src/components/admin/AdminUserMgmt.vue:148` | **super_admin only** |
| POST | `/admin/users/{id}/sessions/revoke-all` | `revokeAllSessions` | `src/components/admin/AdminUserMgmt.vue:202` | admin/super |
| GET | `/admin/audit/login-events` | `listLoginEvents` | `src/components/admin/AdminAuditTable.vue:72` | admin/moderator/super |
| GET | `/admin/posts` | `listPosts` | `src/views/Admin.vue:123` REAL_LOADERS | admin/moderator |
| PUT | `/admin/posts/{id}/offline` | `offlinePost` | （预留） | admin/moderator |
| DELETE | `/admin/posts/{id}` | （PC service 未暴露 — 后端有此端点） | — | admin/super_admin |
| GET | `/admin/orders` | `listOrders` | `src/views/Admin.vue:123` REAL_LOADERS | admin/super |

> Admin 入口 sidebar tab → REAL_LOADERS 映射：`03.1=listPosts`、`04.1=listOrders`、`02.1/02.4/02.R=users pane`、`05.1=audit pane`。

## 8. 用户域 endpoint × 调用点

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| GET | `/user/info` | `getUserInfo` | `src/views/Login.vue:78`（登录后自动拉 + `store.updateUser`） |

## 9. 业务域 endpoint（非 user-auth）

| Method | Path | service fn | 调用点 |
|---|---|---|---|
| GET | `/trade/goods` / `/trade/categories` / `/trade/goods/search` | `goods.*` | `src/views/Market.vue` |
| GET | `/trade/goods/{id}` | `getGoodsDetail` | `src/views/GoodsDetail.vue` |
| POST | `/content/posts` | `getPostList` | `src/views/Home.vue` |
| GET | `/content/posts/{id}` | `getPostDetail` | `src/views/PostDetail.vue` |
| GET | `/model/library` | `getModelLibrary` | `src/views/Profile.vue` |
| DELETE | `/model/library/{modelId}` | `deleteFromLibrary` | `src/views/Profile.vue` |

---

## 10. utils/axios.js PC 端特有处理

- `DEVICE_TYPE = 'pc'` 在请求 header `X-Device-Type` 注入（后端审计 + 限流分群依据 + Sa-Token loginModel）。
- localStorage 命名空间 `fab.pc.*`（区别于 web 的 `fab.web.*`）。
- toast 通道：ElMessage（区别于 web 的 vant Toast）。
- 其余拦截器逻辑（refresh 阈值 15 min / login auto-store / 419-401 跳登录 / response envelope `code:200` unwrap） 与 web **完全同源**，禁单边漂移。

---

## 11. PC 独占 vs Web 调用差异

| Endpoint 组 | Web 是否调 | PC 是否调 |
|---|---|---|
| `/auth/**` 核心 | ✅ | ✅ |
| `/auth/oauth/{google,github,apple}/**` | 仅 apple（移动） | ✅ 三家全用（桌面偏好） |
| `/auth/oauth/wechat-mp/**` | ✅ 移动微信 | ❌ 不暴露 |
| `/mfa/**` | ✅ | ✅ |
| `/captcha/**` | ✅ | ✅ |
| `/user/security/alerts` | ✅ | ✅ |
| **`/admin/**`** | ❌ | ✅ **独占** |

> Web 端若出现 `/admin/**` 调用是逻辑泄漏 bug，应迁回 PC。

---

## 12. Breaking change watch list

后端改下列内容时 PC 仓**必须**联动改（grep service/*.js 找调用点）：

| 后端变更 | PC 影响面 |
|---|---|
| `/admin/users` response shape（如 `rows` → `list`） | `AdminUserMgmt.vue:84` 解构 |
| `LoginEventVO` 字段增减 | `AdminAuditTable.vue` 表列 + zh-CN/en-US `admin.audit.col.*` |
| 角色枚举新增 / 重命名 | `stores/user.js` 5 个 role getter + `AdminRoleEditDialog.ALL_ROLES` + router `meta.requiresRoles` |
| `AuthLoginResponse` 字段（`requireMfa` rename / `mfaToken` ttl） | `Login.vue:157-163` 判定 + `utils/axios.js` AUTO_LOGIN 写 store 条件 |
| `SessionInfo.deviceType` 枚举（如新增 `desktop-electron`） | `PcSessionList.DEVICE_LABEL_KEYS` |
| OAuth provider 增加（如 `microsoft`） | `Login.vue:195 OAUTH_PROVIDERS` + `SettingsSecurity.vue:215 OAUTH_PROVIDERS` + `auth.oauth.providers.*` i18n |
| MFA recovery 数量（10 → N） | `MfaSetupDialog` step=2 grid 自适应 |
| `/admin/audit/login-events` 关键事件 set | `AdminAuditTable.CRIT_EVENTS` + `AdminUserDetailDrawer.CRIT_EVENTS` 同步 |

---

## 13. OpenAPI 契约同步流程

1. 后端 `./scripts/export-openapi.sh` → `../fab-3d-world-api/docs/openapi.yaml`（已 commit）
2. PC 仓 `npm run gen:api` → `src/api/types.ts` 自动重生
3. service/*.js 渐进迁移用 `paths['/x']['post']['requestBody']` 类型注解（JSDoc 阶段，未来转 .ts）

参考：`docs/api-types.md` + 双端同源 `scripts/gen-api-types.mjs`。
