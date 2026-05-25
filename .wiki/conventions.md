# Conventions — fab-3d-world-pc

> 速查约定：Vue 3 / Element Plus 薄壳 / Admin RBAC / 命名 / 安全 / 性能。
> 与 web 共享部分见 `../fab-3d-world-web/.wiki/conventions.md`；本文件突出 PC 独有。

---

## 1. Vue 3 SFC + Element Plus

✅ 必须：`<script setup>` + Composition API + SFC ≤ 400 行
✅ Element 组件**经 `components/ui/` 薄壳**调用
✅ Element locale 走根 `<el-config-provider :locale="elLocale">`（App.vue 已配，业务不重复）
✅ ElMessage / ElNotification / ElMessageBox 入参文案必须 `t()`
✅ 表格分页 `v-model:current-page` / `:page-size`

❌ 业务组件内直接 import `ElXxx` 不经薄壳（除 chrome 级）
❌ 业务层覆盖 Element 主题色（必须 token 覆盖在全局 style.css）
❌ ElDialog 嵌套 > 1 层

## 2. Composition API patterns

复杂业务用 `composables/use<Feature>.js`。表格"查询 + 加载 + 错误"三态写法：

```javascript
const rows = ref([]); const loading = ref(false); const error = ref(null)
async function fetchUsers() {
  loading.value = true; error.value = null
  try { rows.value = await listUsers(filter.value) }
  catch (e) { error.value = e; ElMessage.error(t('admin.users.loadFailed')) }
  finally { loading.value = false }
}
```

## 3. Admin / Ops Console

- **所有 Admin 组件**放 `components/admin/`，命名 `Admin*`
- `/admin` 路由：`meta.requiresAuth: true` + `meta.requiresRoles: ['admin', 'super_admin']`
- **双层校验**：前端 v-if 是 UX；后端必须再校验（不可信赖前端）
- 危险操作（封禁 / 角色 / 删除）走 `ElMessageBox.confirm` 二次确认
- 角色编辑入口 **仅** super_admin 可见：`v-if="userStore.hasRole('super_admin')"`
- Admin 表格必备：分页 + 过滤 + 排序 + 批量选中

## 4. Pinia store

同 web 结构，**命名空间 `fab.pc.*`**：
- `fab.pc.token`
- `fab.pc.user`
- `fab.pc.expireAt`

迁移老命名（`pc_token` / `pc_userInfo`）走 store init 时的 migrateLegacy。

## 5. axios / API

- baseURL = `import.meta.env.VITE_API_BASE_URL`
- DEVICE_TYPE='pc'
- 业务全走 `service/<module>.js`，views 内禁 import axios
- admin 模块 service 函数集中 `service/admin.js`，方便 RBAC review

## 6. I18n

- ElMessage / ElNotification 文案必须 `t()`
- Admin 内组件文案集中 `admin.json`；未来按子模块分（`admin/users.json`）
- 提交前 `node ../scripts/check-i18n-parity.mjs` 全过

## 7. 命名约定

| 类型 | 规则 | 例 |
|---|---|---|
| 组件 | PascalCase | `PcNavbar.vue`, `AdminUserMgmt.vue` |
| PC 独有 primitive | `Pc*` | `PcCtaStack` |
| Admin 组件 | `Admin*` 且在 `components/admin/` | `AdminKpiCard` |
| Composable | `use<Feature>` | `useAdminUserList` |
| Store getter | `is`/`has`/`can` 前缀 | `isAdmin`, `hasRole` |
| service 函数 | 动词开头 | `listUsers`, `banUser` |

## 8. 安全条款（PC 独有）

继承 web §8 全部 +：

- ❌ 业务层硬编码 admin 凭据（即使为 staging）
- ❌ 前端单纯靠 `v-if` 控制 admin 入口而无服务端校验
- ❌ 生产环境保留 `BYPASS_AUTH` flag
- ✅ Admin 危险操作必须 ElMessageBox 二次确认
- ✅ Admin 操作必须走标准 service 接口（后端会记 user_login_event）
- ✅ `console.log` 在 admin 模块**完全禁止**（敏感信息泄露）

提交前自检：

```bash
grep -rn "console.log\|console.debug" src/components/admin/   # 必须零结果
grep -rn "BYPASS_AUTH" src/                                    # 必须零结果
grep -rn "pc_token\|pc_userInfo" src/                          # 应在 store migrateLegacy 外零结果
```

## 9. 性能要点

- ElTable 大数据用虚拟滚动（`row-key` + `v-loading`）
- Admin Console 子组件按 tab 切换才 import（避免一次性全 import）
- ElDialog 关闭 `destroy-on-close`（防 DOM 残留）
- 路由懒加载默认 + 视口 ≥ 1920px 居中不拉伸 content

## 10. 同源副本（与 web 共有，PC 端要保持同步）

- `utils/axios.js`（除 DEVICE_TYPE + fab.pc 命名空间）
- `utils/viewerSoul.js`
- `components/ui/UiReveal.vue`
- `i18n/index.js` + `i18n/detect.js`
- `stores/locale.js` + `stores/user.js`
- `scripts/gen-api-types.mjs`

---

Last reviewed: 2026-05-25 (Step 4 起草版)
