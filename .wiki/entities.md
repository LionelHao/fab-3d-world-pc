# Entities — fab-3d-world-pc

> Pinia stores schema + api/types.ts paths/components 摘要 + admin 表格 row 类型。
> 与 web 同源部分见 `../fab-3d-world-web/.wiki/entities.md`；本文件突出 PC 独有（admin / roles）。

---

## 1. Pinia Stores

与 web 同结构，命名空间 `fab.pc.*`，user 额外暴露 RBAC getters：

```typescript
state: {
  token: string
  user: UserVO & { roles: string[] } | null
  expireAt: number
}

getters: {
  isLoggedIn
  isAdmin: boolean              // roles?.some(r => r === 'admin' || r === 'super_admin')
  hasRole(role: string): boolean
}

actions: {
  login / logout / refresh
  migrateLegacy()              // 老 pc_token / pc_userInfo → fab.pc.* 迁移
}

persisted to localStorage:
- fab.pc.token
- fab.pc.user (JSON, 含 roles[])
- fab.pc.expireAt
```

## 2. 角色枚举

| role | 描述 | UI 影响 |
|---|---|---|
| `user` | 普通用户 | profile 可见，admin 拒绝 |
| `verified_user` | 双因素已验证 | 解锁高级操作 |
| `creator` | 已上传 ≥1 模型 | 可发布 / 编辑作品 |
| `moderator` | 审核员 | `/admin` 部分入口（审计 / 内容审核） |
| `admin` | 平台运营 | `/admin` 全入口 |
| `super_admin` | 平台所有者 | + 角色管理 / 系统设置 |

## 3. api/types.ts（codegen 产物）

`npm run gen:api` 后含完整 `paths` + `components.schemas`。Admin 关键 schema：

- `components['schemas']['UserVO']` — 用户实体
- `components['schemas']['UserListItem']` — Admin 表格 row（含 status / lastLoginAt / banReason）
- `components['schemas']['LoginEventVO']` — 登录审计
- `components['schemas']['RoleAssignmentRequest']` — 角色变更入参

## 4. Admin 表格 Row 类型（迁移到 TS 后用）

```typescript
// 等 admin/AdminUserMgmt.vue 升级 .ts 后填
type UserRow = paths['/admin/users']['get']['responses']['200']['content']['application/json']['data']['list'][number]
type LoginEventRow = paths['/admin/audit/login-events']['get']['responses']['200']['content']['application/json']['data']['list'][number]
```

---

## TODO（首版后由 AI 增量填充）

- [ ] AdminUserMgmt 表格列定义 → schema 字段对照表
- [ ] mocks/admin/*.js fixture 与真实 schema 的差距
- [ ] Profile 富字段 fixture（cd-9） vs 真实 user-info schema 切换路径
- [ ] PcDangerZone（数据导出 / 注销账号）所需 API + DTO（待 user-info 模块立项）

---

Last reviewed: 2026-05-25 (Step 4 骨架)
