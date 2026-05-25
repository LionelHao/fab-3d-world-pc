# API 类型 codegen 指南（pc）

> 工具：`scripts/gen-api-types.mjs` —— 从 `fab-3d-world-api/docs/openapi.yaml` 拉取契约 + 生成 `src/api/types.ts`，给业务代码做类型查询基础。
> 上下游：`../ARCHITECTURE.md` §3.1（契约真相源） + `../fab-3d-world-api/docs/openapi-export.md`（spec 怎么生成的）。
> 双端：`fab-3d-world-web/docs/api-types.md` 是同源副本，改动须同步。

---

## 1. 何时跑 / 怎么跑

| 场景 | 命令 |
|---|---|
| 后端 push 了新 spec 到 main，前端要拉最新 | `npm run gen:api` |
| 自己本地起着 api，想用未 push 的 spec 试 | `npm run gen:api:local`（读 `../fab-3d-world-api/docs/openapi.yaml`） |
| 构建前自动同步 | `npm run build`（已挂 `prebuild` 钩子自动跑） |
| spec 拉不到 / 网络问题 | 默认 warn + exit 0，build 继续。强制失败：`node scripts/gen-api-types.mjs --strict` |

## 2. 输出产物

```
src/api/
└── types.ts        ← 单文件 AUTO-GEN（包含 paths / components / operations 类型）
```

> ⚠️ **不要手改** types.ts，下次 codegen 会被覆盖。

是否 commit？**建议 commit** —— 这样：
- 离线 `npm install` + `npm run dev` 也能跑（不依赖网络拉 spec）
- PR diff 直接显示接口变化（schema 变更可视化）
- CI 不必拉 GitHub raw URL

---

## 3. 使用模式

### 3.1 在 .js 文件里用（JSDoc）

```javascript
// src/service/auth.js
import axios from '@/utils/axios'

/**
 * @typedef {import('@/api/types').paths['/auth/login/password']['post']['requestBody']['content']['application/json']} LoginRequest
 * @typedef {import('@/api/types').paths['/auth/login/password']['post']['responses']['200']['content']['application/json']} LoginResponse
 */

/**
 * @param {LoginRequest} payload
 * @returns {Promise<LoginResponse>}
 */
export function loginByPassword(payload) {
  return axios.post('/auth/login/password', payload)
}
```

VSCode + Volar 会基于 JSDoc 给你完整类型提示，**不需要把文件改成 .ts**。

### 3.2 在 .ts 文件里用（推荐新模块）

```typescript
// src/service/admin.ts
import axios from '@/utils/axios'
import type { paths } from '@/api/types'

type ListUsersQuery = paths['/admin/users']['get']['parameters']['query']
type ListUsersResponse = paths['/admin/users']['get']['responses']['200']['content']['application/json']

export async function listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
  return axios.get('/admin/users', { params: query })
}
```

> Vite + esbuild 原生支持 `.ts`，无需 tsconfig.json 也能跑（仅运行时无类型检查）。
> 现存 `.js` 文件**不要为了用类型一次性全改成 `.ts`**——按需逐文件演进即可。

### 3.3 Admin / Ops Console 的特殊价值

PC 的 admin 模块涉及大量表格 / 表单 / 状态机，类型保护收益最大：

- 表格列定义可直接派生自 schema：`type UserRow = components['schemas']['UserVO']`
- ElForm 的 v-model 字段可类型校验，避免拼写错误
- 状态枚举（user status / role 等）走 `components['schemas']['UserStatus']`

迁移建议优先级：admin > profile > 公开页（home / market / detail）。

---

## 4. 与 utils/axios.js 的关系

**生成的 types.ts 不替代** `utils/axios.js`——

- `utils/axios.js` 处理：拦截器 / refresh / envelope / login store / 419-401 / device header。**留着不动**
- `types.ts` 给业务：请求/响应 schema 约束。**新功能 + 类型迁移时使用**

业务 service 文件就 import 两者：`import axios from '@/utils/axios'` + `import type { paths } from '@/api/types'`。

---

## 5. 迁移路线（无截止日期）

不强制一次性迁移。每次改 `service/<module>.js` 时顺手做：

1. 加 JSDoc `@param` / `@returns` 引用 types.ts 的类型
2. 跑 `npm run test:run` 确保 spec.js 仍绿
3. commit 注 `refactor(pc): <module> service 类型化`

观察一段时间，如果 JSDoc 太繁琐，再考虑把单个 service 文件升级到 `.ts`（admin 先行）。

---

## 6. 双端同源约定

`scripts/gen-api-types.mjs` 在 web 和 pc 是**同源副本**：

- 改 pc 的 → 必须同步改 web 的
- 同步检查（提交前）：

```bash
diff fab-3d-world-web/scripts/gen-api-types.mjs fab-3d-world-pc/scripts/gen-api-types.mjs
# 应当为空（无差异）
```

---

## 7. 故障排查

| 症状 | 排查 |
|---|---|
| `HTTP 404` 拉不到 spec | api 仓还没 commit `docs/openapi.yaml` → 通知后端跑 `./scripts/export-openapi.sh` + commit + push |
| `Cannot find module 'openapi-typescript'` | 跑 `npm install` 安装新加的 devDep |
| IDE 不识别 `@/api/types` import | 检查 `vite.config.js` 的 `resolve.alias` 是否含 `@`（已配，应 OK） |
| 生成的 types.ts 太大（> 2 MB） | spec 本身就大；可考虑分 group codegen（待 codegen 工具支持） |
| 改 spec 后 IDE 还显示旧类型 | TypeScript Language Server 缓存——VSCode 跑 "TypeScript: Restart TS Server" |

---

Last updated: 2026-05-25
