# Flows — fab-3d-world-pc

> 关键交互时序（user-auth P1-P6 全交付后版本）。真相源：`src/views/{Login,SettingsSecurity,Admin,OAuthCallback}.vue` + `src/utils/axios.js` + `src/router/index.js`。

---

## 1. 密码登录 + axios refresh 拦截器

```mermaid
sequenceDiagram
  participant U as 用户
  participant V as Login.vue
  participant AX as utils/axios.js
  participant S as stores/user.js
  participant API as Gateway/Auth

  U->>V: 输入 identifier + password (+ captchaToken? )
  V->>AX: loginByPassword({identifier, password, deviceType:'pc', captchaToken?})
  AX->>AX: 请求拦截：注入 X-Device-Type=pc<br/>无 token, 不触发 ensureFreshToken
  AX->>API: POST /auth/login/password
  API-->>AX: {code:200, data:{token, expireAt, user}}
  AX->>AX: isAutoLoginEndpoint = true
  AX->>S: store.login(token, user, expireAt) — 写 fab.pc.{token,user,expireAt}
  AX-->>V: 返回 unwrapped data
  V->>API: getUserInfo() 拉最新资料（同样走 AX）
  V->>S: store.updateUser(info)
  V->>V: ElMessage.success + router.push(query.from || '/home')
  Note over V,U: 后续业务请求 axios.request 时<br/>触发 ensureFreshToken：若 expireAt - now < 15min<br/>自动 POST /auth/refresh → store.updateToken
```

---

## 2. MFA 二段登录（P6）

```mermaid
sequenceDiagram
  participant U as 用户
  participant V as Login.vue
  participant AX as utils/axios.js
  participant S as stores/user.js
  participant API as Auth

  U->>V: 输入密码 + 提交
  V->>AX: loginByPassword(payload)
  AX->>API: POST /auth/login/password
  API-->>AX: {code:200, data:{requireMfa:true, mfaToken}}
  AX->>AX: isAutoLoginEndpoint=true 但 data 无 token<br/>拦截器不写 store.login
  AX-->>V: 返回 data
  V->>V: mfaStep=true; mfaToken=data.mfaToken<br/>ElMessage.info('auth.login.mfaPrompt')
  U->>V: 输入 6 位 TOTP
  V->>AX: loginMfaVerify(mfaToken, code)
  AX->>API: POST /auth/login/mfa-verify
  alt 验证成功
    API-->>AX: {code:200, data:{token, expireAt, user}}
    AX->>S: store.login(...)
    V->>V: applyLoginResult → getUserInfo + push /home
  else 失败
    API-->>AX: {code:10402}
    AX-->>V: reject 业务错误（已 toast）
    Note over V: mfaStep 保持 true，等用户重输
  end
```

---

## 3. OAuth 登录跳转（P5，PC providers: google / github / apple）

```mermaid
sequenceDiagram
  participant U as 用户
  participant V as Login.vue
  participant CB as OAuthCallback.vue
  participant AX as utils/axios.js
  participant API as Auth
  participant P as Provider (Google/GitHub/Apple)

  U->>V: 点击 OAuth provider 按钮
  V->>AX: oauthAuthorize(p, { redirectUri: origin+'/oauth/callback/'+p })
  AX->>API: GET /auth/oauth/{p}/authorize
  API-->>V: { authorizeUrl, state(stored Redis 5min), pkce? }
  V->>P: window.location.href = authorizeUrl
  P->>U: provider 登录页
  U->>P: 授权
  P->>CB: redirect → /oauth/callback/{p}?code=...&state=...
  CB->>CB: run() onMounted<br/>检查 provider/code/state 三者齐备
  CB->>AX: oauthCallback(p, {code, state, deviceType:'pc'})
  AX->>API: POST /auth/oauth/{p}/callback
  API->>API: 验 state（Redis 一次性） + 换 access_token + 查/插 user_oauth_bind
  API-->>AX: {code:200, data:{token, expireAt, user with bindings}}
  AX->>AX: isAutoLoginEndpoint 命中 → store.login
  CB->>CB: router.replace('/home')
```

错误分支：缺 code/state → toast `auth.oauth.errors.stateMismatch` → `/login?oauth_error=state_mismatch`。

---

## 4. OAuth 绑定流程（已登录态，`?action=bind`）

```mermaid
sequenceDiagram
  participant U as 用户
  participant SS as SettingsSecurity.vue § 05
  participant CB as OAuthCallback.vue
  participant AX as utils/axios.js
  participant API as Auth

  U->>SS: 点击「绑定」按钮（已登录）
  SS->>AX: oauthAuthorize(p, { redirectUri: origin+'/oauth/callback/'+p+'?action=bind' })
  AX->>API: GET /auth/oauth/{p}/authorize
  API-->>SS: { authorizeUrl }
  SS->>U: window.location.href = authorizeUrl
  U-->>CB: provider redirect → /oauth/callback/{p}?code=&state=&action=bind
  CB->>CB: isBind = (action === 'bind') = true
  CB->>AX: oauthBind(p, {code, state})  ← 注意：bind 而非 callback
  AX->>API: POST /auth/oauth/{p}/bind  (Bearer token 已注入)
  alt 成功
    API-->>CB: 200
    CB->>CB: ElMessage.success + router.replace('/settings/security')
  else 10301 绑定冲突（该 OAuth 已被他人绑定）
    CB->>CB: toast `auth.oauth.errors.bindingConflict` + replace /settings/security
  end
```

> SettingsSecurity 重渲染后通过 `userStore.bindings` 计算 isProviderBound → 按钮切「解绑」。
> 解绑：`oauthUnbind(p)` 成功后 `userStore.setBindings(filtered)` 不可变更新本地。

---

## 5. Admin RBAC 双层守卫（P4）

```mermaid
sequenceDiagram
  participant U as 用户
  participant R as Router
  participant S as stores/user.js
  participant V as Admin.vue
  participant AX as utils/axios.js
  participant GW as Gateway
  participant ADM as admin service

  U->>R: navigate to /admin
  R->>R: beforeEach 守卫
  alt 未登录 (isLoggedIn=false)
    R->>U: push /login?from=/admin
  else 登录但非 admin/super_admin
    R->>S: hasAnyRole(['admin','super_admin'])
    S-->>R: false
    R->>U: ElMessage.warning + push /home
  else 通过
    R->>V: 加载 Admin.vue
    V->>V: filteredSidebar = computed role-gated
    V->>AX: getDashboard() (默认 dashboard pane)
    AX->>AX: 请求拦截：Bearer + X-Device-Type=pc
    AX->>GW: GET /admin/dashboard
    GW->>GW: SaToken filter — 服务端二次 RBAC<br/>(StpInterface.getRoleList(userId))
    alt 服务端校验失败（前端 v-if 被绕过）
      GW-->>AX: 403 / 401
      AX->>AX: 拦截器：code 401 → store.logout + push /login
    else 通过
      GW->>ADM: forward
      ADM-->>V: {data: dashboard counts}
      V->>V: enrichAdmin(dashboard) 注入 sidebar
    end
  end
```

> 关键点：前端 `v-if="userStore.isSuperAdmin"` 只是 UX 优化（隐藏按钮），服务端 SaToken filter 才是真实安全边界。

---

## 6. 敏感操作 MFA 验证（P6 — 通用模式）

```mermaid
sequenceDiagram
  participant U as 用户
  participant SS as SettingsSecurity.vue
  participant D as MfaVerifyDialog / MfaSetupDialog / MfaDisableDialog
  participant AX as utils/axios.js
  participant API as MFA Service

  U->>SS: 点击「关闭 MFA」/「重新生成恢复码」/「解绑 OAuth」
  SS->>D: v-model:open = true（具体 dialog）
  alt MfaDisableDialog
    U->>D: 输入密码 + 6 位 TOTP
    D->>AX: POST /mfa/disable {password, code}
  else MfaRecoveryRegenDialog (step=1)
    U->>D: 输入 6 位 TOTP
    D->>AX: POST /mfa/recovery-codes {code}
  end
  AX->>API: 转发
  alt 成功
    API-->>D: 200
    D->>D: emit('disabled' / 'regenerated')
    SS->>SS: refreshMfaStatus() 重新拉 /mfa/status
  else 10402 code 无效
    API-->>D: {code:10402}
    Note over D: 拦截器已 toast；dialog 保持开放
  end
```

---

## 7. 改密 → kickout 全设备（P3）

```mermaid
sequenceDiagram
  participant U as 用户
  participant SS as SettingsSecurity.vue §01
  participant S as stores/user.js
  participant AX as utils/axios.js
  participant API as Auth

  U->>SS: 输入旧密码 + 新密码 + 确认
  SS->>SS: 客户端校验：validatePassword + 长度 + scorePassword + 与旧密码不同
  SS->>AX: changePassword({oldPassword, newPassword})
  AX->>API: POST /auth/password/change (Bearer)
  API->>API: 校验旧密 + 入 BCrypt 新哈希 + StpUtil.kickout(userId) 全设备下线
  API-->>AX: 200
  SS->>AX: logout() (best-effort，后端已下线)
  AX->>API: POST /auth/logout
  Note over API: token 已失效，可能 419 — 容忍
  SS->>S: userStore.logout() — 清本地 fab.pc.*
  SS->>U: router.push('/login')
  Note over U: 后续若有其他标签页持旧 token → 任意请求触发<br/>response 419 → 拦截器自动 logout + 跳 /login
```

---

## 8. 密码重置三步（P2）

```mermaid
sequenceDiagram
  participant U as 用户
  participant V as ForgotPassword.vue
  participant CD as utils/countdown.js
  participant AX as utils/axios.js
  participant API as Auth

  U->>V: STEP 1 输入 identifier（email/phone/username）
  V->>AX: requestPasswordReset(identifier)
  AX->>API: POST /auth/password/reset/request {target}
  API-->>AX: 200（后端发码到 target）
  V->>CD: countdown.start(60s)
  V->>V: step=2

  U->>V: STEP 2 输入 6 位 code（客户端格式校验）
  V->>V: /^\d{6}$/ 通过 → step=3
  Note over V: 倒计时未结束时禁重发；resend 调同一 API

  U->>V: STEP 3 输入新密码 + 确认
  V->>AX: confirmPasswordReset({target, code, newPassword})
  AX->>API: POST /auth/password/reset/confirm
  alt 成功
    API->>API: 校验 code + 设新密码 + kickout 全设备
    API-->>V: 200
    V->>V: ElMessage.success + router.push('/login')
  else code 无效 / 过期
    API-->>V: {code:10xxx}
    Note over V: 拦截器已 toast；保留 step=3 让用户回 step=2 重输
  end
```

---

## 9. AdminUserMgmt 列表 → 封禁/角色编辑/强制下线

```mermaid
sequenceDiagram
  participant U as 运营员
  participant V as AdminUserMgmt.vue
  participant D as Ban/RoleEdit Dialog
  participant AX as utils/axios.js
  participant API as Admin Service

  V->>AX: listUsers({keyword, status, role, page, size})
  AX->>API: GET /admin/users
  API-->>V: {rows, total}

  U->>V: 点击「封禁」
  V->>D: AdminBanDialog v-model:open=true
  U->>D: 输入 reason (必填) + untilAt? ElDatePicker
  D->>V: emit('submit', {reason, untilAt?})
  V->>AX: banUser(userId, body)
  AX->>API: PUT /admin/users/{id}/ban
  API-->>V: 200
  V->>V: ElMessage.success + reload list

  U->>V: 点击「编辑角色」(super_admin only)
  V->>D: AdminRoleEditDialog v-model:open=true
  U->>D: 勾选 / 取消 roles
  D->>D: 校验：至少 1 个 + 禁自降 super_admin
  D->>V: emit('submit', {add:[], remove:[]})
  V->>AX: setUserRoles(userId, body)
  AX->>API: PUT /admin/users/{id}/roles
  API-->>V: 200 + reload

  U->>V: 点击「强制下线」
  V->>V: ElMessageBox.confirm({type:'warning'})
  U->>V: confirm
  V->>AX: revokeAllSessions(userId)
  AX->>API: POST /admin/users/{id}/sessions/revoke-all
  API-->>V: {revokedCount}
  V->>V: ElMessage.success('已下线 N 个 session')
```

---

## 10. 视图横切机制速查

- **AdminSidebar role-gated**：`filteredSidebar` computed 按当前用户 roles 过滤 sections / tabs（super_admin 注入 Roles 子 tab；moderator 只见 §05.1 Audit；Danger Zone 仅 super_admin）。
- **危险操作二次确认**：`ElMessageBox.confirm({type:'warning'})`（PC 标准），或 `ElPopconfirm`（settings/security 下线其他设备用）。
- **视口降级**：window resize < 768px 显示「请在桌面端访问」（部分页面）；登录 / forgot / oauth callback 不做降级。
- **居中布局**：admin-page width=1440px min-width=1440px（不响应式，专为桌面 1440+ 设计）。
- **AdminStream / Alert / Tickets 仍是 fixture**：M4 / M5 用户运营 / 客服模块上线时替换为真接口（spec backlog）。
