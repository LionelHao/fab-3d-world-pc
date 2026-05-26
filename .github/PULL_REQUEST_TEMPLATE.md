<!--
PR 模板 — fab-3d-world-pc (桌面 + Ops Console)
SDD + TDD 双协议门禁。提交前确认每个 section 都填齐。
-->

## 1. 涉及 spec / capability

- **L2 spec**：`docs/design/<module>/01-architecture.md#<section>`（或 `docs/design/specs/p3.X-<page>.md` for UI 改动）
- **L1 capability**：`<module>.<feature-slug>`
- **AC 编号**：AC-PX.Y
- **ADR**（如新决策）：ADR-NNNN，标题：

## 2. 改动摘要

<2-3 句"为什么改"。>

## 3. TDD 检查（强制）

- [ ] RED：先写测试且确认失败（commit hash：__________）
- [ ] GREEN：`npm run test:run` 全过 + 覆盖率 ≥ 80%（admin 模块 ≥ 85%）
- [ ] 反向用例：null / 边界 / 4xx-5xx / 并发 / 角色权限 都覆盖
- [ ] **Admin / RBAC 改动**：E2E `admin-rbac.spec.js` 跑过（non-admin 跳 home / admin 进入 / super_admin 看到角色编辑）
- [ ] Playwright E2E：相关 golden path 通过

## 4. SDD 检查（强制）

- [ ] 改 / 加的 views / service / store / components/admin 已有 `@spec` `@capability` JSDoc 锚点
- [ ] 新加的能力已在 `docs/reference/capabilities/<slug>.md` 注册
- [ ] 新加的决策已开 ADR
- [ ] `node scripts/sdd/check-anchors-shallow.mjs` 全绿（CI 自动跑）
- [ ] 本地跑过 full check：`cd .. && node scripts/sdd/check-anchor-integrity.mjs --repo fab-3d-world-pc`

## 5. 跨仓 / 同源副本 / Admin 双层校验

- [ ] 改了双端同源副本 → 同步更新 Web 端（链 PR 地址：）
- [ ] 改了 API 用法 → 已跑 `npm run gen:api` 重生 types
- [ ] **Admin / RBAC 改动**：服务端 role 校验已确认（前端 v-if 不可信赖）
- [ ] 改了 i18n → `node ../scripts/check-i18n-parity.mjs` 全过

## 6. 跳 TDD 的特殊情况（如适用）

仅纯样式 / 文档 / locale / 依赖升级允许，commit 注 `[tdd-skip: <reason>]`。
