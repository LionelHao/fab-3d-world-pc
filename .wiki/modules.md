# Modules — fab-3d-world-pc

> 桌面 + Ops Console 目录拆解。与 web 同源部分见 `../fab-3d-world-web/.wiki/modules.md`；本文件突出 PC 独有部分。

---

## 1. 目录结构

```
src/
├── views/              # 8 个页面（含 Admin Ops Console）
├── components/
│   ├── ui/             # 5 件套（从 web port）+ PC 端独有 primitive
│   ├── home/           # Home section 组件
│   ├── profile/        # Profile sidebar / sub-section / activity / achievement
│   ├── admin/          # ★ Ops Console 9 件套
│   ├── PcNavbar.vue / PcTelemetryStrip.vue / PcSectionHeader.vue / PcFooter.vue
│   └── PcLocaleSwitcher.vue
├── stores/             # Pinia stores（locale.js / user.js）
├── service/            # HTTP 接口
├── utils/              # axios / parseRich / viewerSoul
├── i18n/               # vue-i18n
├── locales/<locale>/   # 翻译资源
├── router/             # 路由 + 守卫
├── mocks/              # cd-9-fixture + admin 各 fixture
├── api/                # codegen 产物
├── common/             # 跨页共享
└── style.css
```

---

## 2. Views（8 个页面）

| 文件 | 路由 | 角色 | 鉴权 |
|---|---|---|---|
| `Home.vue` | `/home` | 创作者社区首页 + 桌面布局 | 公开 |
| `Market.vue` | `/market` | 商城列表 | 公开 |
| `GoodsDetail.vue` | `/goods/:id` | 商品详情 + 3D viewer + 5 件套 stick | 公开 |
| `PostDetail.vue` | `/post/:id` | 帖子详情 | 公开 |
| `Login.vue` | `/login` | 登录 + 注册 + 验证码 | 公开 |
| `ForgotPassword.vue` | `/forgot-password` | 找回密码 | 公开 |
| `Profile.vue` | `/profile` | 个人中心 + sidebar + dossier | requiresAuth |
| `Admin.vue` | `/admin` | **Ops Console**（用户管理 / 审计 / 角色） | requiresAuth + requiresRoles: ['admin', 'super_admin'] |

---

## 3. PC 独有 Primitives

**chrome (4)**：`PcNavbar` · `PcTelemetryStrip`（含 `items` prop 自定段位）· `PcSectionHeader` · `PcFooter`

**Home section (4)**：`home/PcHeroPlate`（hasViewer + canvasRef）· `home/PcHeroCopy` · `home/PcMakerCard` · `home/PcFarmCard`

**Detail section (5)**：`PcCtaStack` · `PcViewerStage` · `PcDetailStick` · `PcFileRow` · `PcRelatedCard`

**Profile (4)**：`profile/PcProfileSidebar` · `profile/PcSubSection` · `profile/PcActivityLog` · `profile/PcAchievementCard`

**Admin / Ops Console (9)**：
- 数据卡 5：`admin/AdminCard` · `admin/AdminKpiCard` · `admin/AdminStream` · `admin/AdminAlert` · `admin/AdminTicketsTable`
- chrome 4：`admin/AdminNav` · `admin/AdminTelemetry` · `admin/AdminSidebar`（200px 6 section 19 stab）· `admin/AdminFooter`

**Ui base port (5)**：`UiChip` (+lg+count) · `UiSearchBar` (+kbd) · `UiIconButton` · `UiAvatar` (+palette 5) · `UiCard` (PC variant)

详细 props / variants 见父 `../CLAUDE.md`（首期保留，Step 5 瘦身后迁入本节）。

---

## 4. Stores

与 web 同结构，**命名空间 `fab.pc.*`**：

| Store | 文件 | 角色 |
|---|---|---|
| `useUserStore` | `stores/user.js` | token / user / expireAt + login/logout + isAdmin / hasRole getters（fab.pc.* 命名空间） |
| `useLocaleStore` | `stores/locale.js` | i18n + ElConfigProvider locale 派发 |

> ⚠ 与 web 的命名空间差异：fab.web.* vs fab.pc.*；DEVICE_TYPE: web vs pc

---

## 5. Service

| 文件 | 对应后端 prefix |
|---|---|
| `service/auth.js` | `/auth/**` |
| `service/user.js` | `/user/**` |
| `service/admin.js` | ★ `/admin/**`（PC 独占） |
| `service/goods.js` | `/trade/goods/**` |
| `service/content.js` | `/content/**` |
| `service/model.js` | `/model/**` |

---

## 6. Router 守卫（双层）

```javascript
{ path: '/profile', meta: { requiresAuth: true } },
{ path: '/admin',   meta: { requiresAuth: true, requiresRoles: ['admin', 'super_admin'] } }
```

- 客户端：`router.beforeEach` 拦截，UX 跳转
- 服务端：gateway SaToken filter，真权限边界
- **永远不**只靠前端守卫

---

## 7. Utils

- `utils/axios.js` (139 行) — 同 web 拦截器逻辑 + DEVICE_TYPE='pc' + fab.pc 命名空间
- `utils/parseRich.js` — `<b>/<em>/<n>/<crit>` 内联标签 segment 解析（AdminStream / AdminAlert 共用）
- `utils/viewerSoul.js` — 3D viewer soul（双端同源）

---

## 8. I18n

PC 当前 8 个 namespace（home / market / postDetail / goodsDetail / profile / admin / login / common）。

---

## 9. 与 web 的关键差异速查

| 维度 | web | pc |
|---|---|---|
| 主视口 | 375-414px | 1200-1920px |
| Admin 入口 | 无 | `/admin`（独占） |
| UI 库 | Vant | Element Plus |
| storage namespace | `fab.web.*` | `fab.pc.*` |
| X-Device-Type | `web` | `pc` |
| 移动端 | 主战场 | <768px 降级提示 |
| OAuth provider 倾向 | 微信 / Apple | Google / GitHub / Apple |

---

Last reviewed: 2026-05-25 (Step 4 起草版)
