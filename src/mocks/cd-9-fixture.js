/**
 * cd-9-desktop-admin.html Mock Fixture (Phase 3.11 — PC Admin / Ops Console)
 *
 * 用途: backend `/admin/*` 仅返回 dashboard 计数 + posts/users/orders 三张精简列表,
 * 而 cd-9 Ops Console 还需 telemetry / KPI delta+spark / live stream / alerts /
 * reports queue 等运营态数据. 本 fixture 为 1:1 复刻 inspiration HTML 元素密度提供占位.
 *
 * 接口契约 (与 docs/design/specs/p3.11-admin-fixture.md §4/§5 同步):
 *   enrichAdmin(dashboard) 输出满足 ctx / telemetry / sidebar / kpi / stream /
 *   alerts / tickets / footer 全部槽位.
 *
 * 维护规则:
 *  1. 每个 mock 字段单行 `// TODO: backend integration` 标注
 *  2. backend 补字段后移除 fallback, fixture 仅 dev-only fallback
 *  3. fixture 仅补齐, 不覆盖 backend 已返回字段
 */

/* ------------------------------------------------------------------ */
/*  品牌 / chrome 常量                                                 */
/* ------------------------------------------------------------------ */

export const adminBrandConstants = {
  // TODO: backend integration — 品牌常量, 无后端依赖
  wordmark: { left: 'FAB', divider: '/', right: '3D', tag: 'LAB' },
  appMode: 'ADMIN · OPS CONSOLE',
}

// TODO: backend integration — session / saved 状态需后端补 (admin 会话遥测)
export const adminCtxDefaults = {
  operator: 'ADM-04 · K.LIANG',
  session: '4h 12m',
  tickets: 23,
  alerts: 2,
  savedAgo: '8s ago',
}

// TODO: backend integration — 运维实时遥测 (uptime/req/error/db/queue/...) 需后端补
export const adminTelemetryDefaults = {
  live: true,
  items: [
    ['OPS LIVE', ''],
    ['UPTIME', '99.97%'],
    ['REQ/s', '142'],
    ['ERROR', '0.03%'],
    ['DB', '47ms'],
    ['QUEUE', '12'],
    ['STORAGE', '47% / 2 TB'],
    ['CPU', '22%', 'warn'],
    ['NET', 'BLN ⇌ BKN'],
  ],
}

/* ------------------------------------------------------------------ */
/*  派生工具                                                          */
/* ------------------------------------------------------------------ */

/** 14247 → '14,247' (千分位) */
export function formatGrouped(n) {
  return (Number(n) || 0).toLocaleString('en-US')
}

/** 14247 → '14.2k' / 482000 → '482k' (sidebar section count 紧凑显示) */
export function formatCompact(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 1 : 0)}k`
  return String(v)
}

/** 2487654 → '¥2.4M' (commerce section count) */
export function formatRevenue(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `¥${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `¥${(v / 1000).toFixed(1)}k`
  return `¥${v}`
}

/* ------------------------------------------------------------------ */
/*  § Sidebar — 6 section / 19 stab                                    */
/* ------------------------------------------------------------------ */

// TODO: backend integration — 各 section count / stab pill 计数需后端补
export const sidebarFixture = {
  sections: [
    {
      ix: '§ 01',
      name: 'Overview',
      count: 'LIVE',
      tabs: [{ ix: '01.1', label: 'Dashboard' }],
    },
    {
      ix: '§ 02',
      name: 'Users',
      count: '14.2k',
      tabs: [
        { ix: '02.1', label: 'All Users', pill: '14,247' },
        { ix: '02.2', label: 'Makers', pill: '87' },
        { ix: '02.3', label: 'Suspended', pill: '12', pillTone: 'warn' },
        { ix: '02.4', label: 'KYC Pending', pill: '8', pillTone: 'warn' },
      ],
    },
    {
      ix: '§ 03',
      name: 'Content',
      count: '482k',
      tabs: [
        { ix: '03.1', label: 'Posts' },
        { ix: '03.2', label: 'Models' },
        { ix: '03.3', label: 'Comments' },
        { ix: '03.4', label: 'Reports', pill: '23', pillTone: 'crit' },
      ],
    },
    {
      ix: '§ 04',
      name: 'Commerce',
      count: '¥2.4M',
      tabs: [
        { ix: '04.1', label: 'Orders' },
        { ix: '04.2', label: 'Refunds', pill: '3', pillTone: 'warn' },
        { ix: '04.3', label: 'Bounties' },
        { ix: '04.4', label: 'Payouts' },
      ],
    },
    {
      ix: '§ 05',
      name: 'System',
      count: 'OK',
      tabs: [
        { ix: '05.1', label: 'Audit Log' },
        { ix: '05.2', label: 'Config' },
        { ix: '05.3', label: 'API Keys' },
        { ix: '05.4', label: 'Webhooks' },
      ],
    },
    {
      ix: '§ 06',
      name: 'Danger Zone',
      count: 'RESTRICTED',
      countTone: 'crit',
      danger: true,
      tabs: [
        { ix: '06.1', label: 'Mass Delete' },
        { ix: '06.2', label: 'Rollback' },
      ],
    },
  ],
  foot: [
    { k: 'LAST DEPLOY', v: '22M AGO' },
    { k: 'DB MASTER', v: 'EU-WEST-1' },
    { k: 'INCIDENT 30D', v: '0 / 0' },
  ],
}

/* ------------------------------------------------------------------ */
/*  § KPI strip — 4 卡                                                 */
/* ------------------------------------------------------------------ */

// spark: SVG polyline points 字符串 (viewBox 0 0 80 28); 装饰图样, 不入业务接口
// TODO: backend integration — KPI 数值 / delta / spark 全部需后端补 (运营聚合)
export const kpiFixture = [
  {
    ix: 'KPI · 01',
    tag: 'DAU',
    stamp: 'MON 09:41',
    label: 'Daily Active Users',
    value: '4,127',
    delta: '+12% vs 7d',
    deltaDir: 'up',
    spark: '2,22 12,18 22,20 32,14 42,16 52,10 62,12 72,6 78,4',
  },
  {
    ix: 'KPI · 02',
    tag: 'UPLOADS',
    stamp: 'MON 09:41',
    label: 'New Models',
    value: '87',
    delta: '+22% vs 7d',
    deltaDir: 'up',
    spark: '2,20 12,22 22,16 32,18 42,12 52,14 62,8 72,10 78,4',
  },
  {
    ix: 'KPI · 03',
    tag: 'ORDERS',
    stamp: 'MON 09:41',
    label: 'Orders · Revenue',
    value: '23',
    unit: '/ ¥4,892',
    delta: '+8% vs 7d',
    deltaDir: 'up',
    spark: '2,18 12,16 22,20 32,18 42,14 52,16 62,12 72,14 78,8',
  },
  {
    ix: 'KPI · 04',
    tag: 'TICKETS',
    stamp: '5 CRIT',
    stampTone: 'crit',
    label: 'Open Tickets',
    value: '23',
    unit: '/ 5 CRIT',
    valTone: 'crit',
    delta: '+4 in last 1h',
    deltaDir: 'down',
    deltaTone: 'crit',
    spark: '2,16 12,14 22,18 32,12 42,14 52,10 62,8 72,6 78,4',
    sparkTone: 'crit',
  },
]

/* ------------------------------------------------------------------ */
/*  § S — Live Stream tail (12 事件)                                   */
/* ------------------------------------------------------------------ */

// TODO: backend integration — 实时事件流 /admin/stream 需后端补
export const streamFixture = [
  { ts: '09:41:22', type: 'UPLOAD', typeClass: 'upload', desc: '<b>@ironforge</b> published <b>mecha_dragon_v3.4.stl</b> · <em>FBW-2447-DRG</em> · <n>8.2 MB</n>' },
  { ts: '09:41:18', type: 'ORDER', typeClass: 'order', desc: '<b>#4892</b> paid · PLA bundle · 4 items · <n>¥99.00</n>' },
  { ts: '09:41:14', type: 'REGISTER', typeClass: 'register', desc: '<b>@print.kid</b> created account · phone bind · <em>+86 138 ····0042</em>' },
  { ts: '09:40:58', type: 'ERROR', typeClass: 'error', desc: '<b>/api/render</b> returned <crit>504</crit> · 1 occurrence · gateway <em>eu-west-1</em>' },
  { ts: '09:40:42', type: 'TIP', typeClass: 'tip', desc: '<b>@voxel.kid</b> → <b>@ironforge</b> · <n>$5.00</n> · note "best PIP dragon"' },
  { ts: '09:40:31', type: 'COMMENT', typeClass: 'comment', desc: '<b>@solder.fox</b> on Dragon V3.4 · <em>auto-passed moderation</em>' },
  { ts: '09:40:15', type: 'REPORT', typeClass: 'report', desc: 'Post <b>#2447</b> flagged · <em>1 vote · IP infringement (manual)</em>' },
  { ts: '09:39:58', type: 'CERT', typeClass: 'cert', desc: 'Class A re-validated for <b>@ironforge</b> · next audit 2027-05-17' },
  { ts: '09:39:42', type: 'FOLLOW', typeClass: 'follow', desc: '<b>12</b> new operators today · weekly batch (Dragon V3 release)' },
  { ts: '09:39:30', type: 'DEPLOY', typeClass: 'deploy', desc: 'Backend <b>v3.47.1</b> · CI <b>#8421</b> · author <em>k.liang</em> · 4 services' },
  { ts: '09:39:12', type: 'API', typeClass: 'api', desc: '<b>/content/posts</b> sustained <n>142 req/s</n> · p95 <n>38 ms</n> · headroom OK' },
  { ts: '09:38:55', type: 'BACKUP', typeClass: 'backup', desc: 'DB snapshot OK · <n>47 GB</n> · S3 <em>fbw-ops-snap-bln</em> · 18s' },
]

export const streamMeta = {
  // TODO: backend integration — 总事件数 / tail 时间戳需后端补
  showing: 12,
  total: '2,841',
  window: '60s WINDOW',
  tailFrom: '09:41:22',
}

/* ------------------------------------------------------------------ */
/*  § A — Alerts (2 条)                                                */
/* ------------------------------------------------------------------ */

// TODO: backend integration — 告警源 /admin/alerts 需后端补
export const alertsFixture = [
  {
    sev: 'P1 · CRIT',
    tone: 'crit',
    age: '1H 27M AGO',
    title: 'DB Write Spike · eu-west-1',
    since: 'Since <b>08:14</b> · master IOPS <b>3.4k → 12.1k</b> · queue depth <b>47</b>',
    actions: [
      { label: 'Investigate', primary: true },
      { label: 'Snooze 1h' },
    ],
  },
  {
    sev: 'P2 · WARN',
    tone: 'warn',
    age: '39M AGO',
    title: 'CDN Miss Rate ↑ 18%',
    since: 'Since <b>09:02</b> · hit-ratio <b>94% → 76%</b> · region <b>ap-east-1</b>',
    actions: [
      { label: 'Investigate', primary: true },
      { label: 'Snooze 1h' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  § T — Tickets / Reports queue (8 行)                               */
/* ------------------------------------------------------------------ */

// TODO: backend integration — reports queue 需后端补 (现 /admin/posts 仅 id/title/status)
export const ticketsFixture = [
  { id: '#TKT-2402', type: 'POST', target: 'FBW-2447-DRG', reporter: '@voxel.kid', sev: 'WARN', sevClass: 'warn', status: 'OPEN', statusClass: 'open', age: '12m', actions: [{ label: 'Review', kind: 'primary' }, { label: 'Dismiss' }] },
  { id: '#TKT-2401', type: 'USER', target: '@bad.actor', reporter: '@mod.bot', sev: 'CRIT', sevClass: 'crit', status: 'OPEN', statusClass: 'open', age: '1h', actions: [{ label: 'Suspend', kind: 'crit' }, { label: 'Review' }] },
  { id: '#TKT-2400', type: 'COMMENT', target: 'cmt-9821', reporter: '@solder.fox', sev: 'INFO', sevClass: 'info', status: 'OPEN', statusClass: 'open', age: '2h', actions: [{ label: 'Review', kind: 'primary' }, { label: 'Dismiss' }] },
  { id: '#TKT-2399', type: 'ORDER', target: '#4521', reporter: '@customer.x', sev: 'WARN', sevClass: 'warn', status: 'IN_REVIEW', statusClass: 'review', age: '4h', actions: [{ label: 'Continue', kind: 'primary' }] },
  { id: '#TKT-2398', type: 'PAYOUT', target: '@maker.y', reporter: 'system', sev: 'INFO', sevClass: 'info', status: 'RESOLVED', statusClass: 'resolved', age: '12h', actions: [{ label: 'Archive' }] },
  { id: '#TKT-2397', type: 'MODEL', target: 'mdl-9912', reporter: '@ip.checker', sev: 'CRIT', sevClass: 'crit', status: 'OPEN', statusClass: 'open', age: '14h', actions: [{ label: 'Takedown', kind: 'crit' }, { label: 'Review' }] },
  { id: '#TKT-2396', type: 'KYC', target: '@new.maker', reporter: 'system', sev: 'INFO', sevClass: 'info', status: 'OPEN', statusClass: 'open', age: '18h', actions: [{ label: 'Approve', kind: 'hilite' }, { label: 'Reject' }] },
  { id: '#TKT-2395', type: 'DMCA', target: 'mdl-9911', reporter: '@rightsholder', sev: 'CRIT', sevClass: 'crit', status: 'OPEN', statusClass: 'open', age: '1d', actions: [{ label: 'Takedown', kind: 'crit' }, { label: 'Counter' }] },
]

export const ticketsMeta = {
  // TODO: backend integration — 队列总数 / 排序需后端补
  showing: 8,
  total: 23,
  crit: 5,
  sort: 'SEV DESC · AGE ASC',
}

/* ------------------------------------------------------------------ */
/*  § Footer                                                           */
/* ------------------------------------------------------------------ */

// TODO: backend integration — 在线 admin 数 / 网络状态需后端补
export const footerFixture = {
  version: '3.47',
  sessions: '12 admins online',
  network: 'NOMINAL',
  shortcuts: [
    { keys: ['⌘', 'K'], label: 'Palette' },
    { keys: ['⌘', ','], label: 'Settings' },
    { keys: ['ESC'], label: 'Dismiss' },
  ],
}

/* ------------------------------------------------------------------ */
/*  enrichAdmin — 合并 backend dashboard 计数 + fixture                */
/* ------------------------------------------------------------------ */

/**
 * backend /admin/dashboard 返回 { userCount, postCount, goodsCount, orderCount }.
 * 真实计数注入 sidebar section count（运营总量域），KPI 仍走 mock（运营聚合 KPI
 * 后端未覆盖：DAU / 7d delta / spark 都是 admin 专属指标）。
 *
 * @param {object} dashboard backend /admin/dashboard 返回 (可空)
 * @returns {object} 完整 Ops Console view-model
 */
export function enrichAdmin(dashboard = {}) {
  const d = dashboard || {}
  const hasUsers = Number.isFinite(Number(d.userCount))
  const hasPosts = Number.isFinite(Number(d.postCount))
  const hasOrders = Number.isFinite(Number(d.orderCount))

  // sidebar: 真实计数优先注入 section count + 首 stab pill
  const sections = sidebarFixture.sections.map((sec) => {
    if (sec.name === 'Users' && hasUsers) {
      return {
        ...sec,
        count: formatCompact(d.userCount),
        tabs: sec.tabs.map((t, i) => (i === 0 ? { ...t, pill: formatGrouped(d.userCount) } : t)),
      }
    }
    if (sec.name === 'Content' && hasPosts) {
      return { ...sec, count: formatCompact(d.postCount) }
    }
    return sec
  })

  return {
    brand: adminBrandConstants,
    ctx: adminCtxDefaults,
    telemetry: adminTelemetryDefaults,
    sidebar: { ...sidebarFixture, sections },
    kpi: kpiFixture,
    stream: { rows: streamFixture, meta: streamMeta },
    alerts: alertsFixture,
    tickets: { rows: ticketsFixture, meta: ticketsMeta },
    footer: footerFixture,
    // 真实 dashboard 计数透传, 供调用方按需消费
    counts: {
      userCount: hasUsers ? d.userCount : null,
      postCount: hasPosts ? d.postCount : null,
      goodsCount: Number.isFinite(Number(d.goodsCount)) ? d.goodsCount : null,
      orderCount: hasOrders ? d.orderCount : null,
    },
  }
}
