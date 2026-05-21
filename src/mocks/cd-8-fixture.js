/**
 * cd-8-desktop-profile.html Mock Fixture (Phase 3.10 — PC Operator Dashboard)
 *
 * 用途: backend `/user/info` 仅返回 username/nickname/bio/avatar/id, 而 cd-8 operator
 * dashboard 还需 sidebar dossier + 8-cell stat grid + activity log + achievements.
 * 本 fixture 为 1:1 复刻 inspiration HTML 元素密度提供占位数据.
 *
 * 接口契约 (与 docs/design/specs/p3.10-profile-fixture.md §4 同步):
 *   enrichProfilePc(userInfo) 输出满足 sidebar / identity / stats / log / achievements 槽位.
 *
 * 维护规则:
 *  1. 每个 mock 字段单行 `// TODO: backend integration` 标注
 *  2. backend 补字段后移除 fallback, fixture 仅 dev-only fallback
 *  3. fixture 仅补齐, 不覆盖 backend 已返回字段
 */

/* ------------------------------------------------------------------ */
/*  品牌 / chrome 常量                                                 */
/* ------------------------------------------------------------------ */

export const profileBrandConstants = {
  // TODO: backend integration — 品牌常量, 无后端依赖
  wordmark: { left: 'FAB', divider: '/', right: '3D', tag: 'LAB' },
  pageTitle: 'Operator',
}

export const pcTelemetryDefaults = {
  // TODO: backend integration — network/rep/uploads/revenue 需后端补
  live: true,
  items: [
    ['STUDIO LIVE', ''],
    ['NETWORK', '12 MS'],
    ['REP', '4.8 / 5'],
    ['UPLOADS', '47'],
    ['REVENUE', '¥2,847'],
    ['LAST LOGIN', '12s AGO'],
  ],
}

/* ------------------------------------------------------------------ */
/*  派生工具                                                          */
/* ------------------------------------------------------------------ */

/** 14247 → '14,247' (PC stat grid 用千分位全量) */
export function formatGrouped(n) {
  return (Number(n) || 0).toLocaleString('en-US')
}

/** '@ironforge'|'Iron Forge Studio' → 'IF' */
export function deriveInitials(name = '') {
  const clean = String(name).replace(/^@/, '').trim()
  if (!clean) return 'OP'
  if (/[一-龥]/.test(clean)) return clean.slice(0, 1)
  const words = clean.split(/[\s._-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

/** id → 'FBW-A47-2024' */
export function deriveOpId(id) {
  // TODO: backend integration — 后端补 op_id 后直接取用
  const raw = String(id ?? '0047').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return `FBW-${raw.slice(0, 3).padStart(3, '0')}-2024`
}

/* ------------------------------------------------------------------ */
/*  § Sidebar                                                          */
/* ------------------------------------------------------------------ */

// TODO: backend integration — dossier tier/joined/station 需后端补
export const sidebarFixture = {
  dossier: [
    { k: 'OP · ID', v: 'FBW-A47-2024' },
    { k: 'Tier', v: 'CERT · MAKER', chip: true },
    { k: 'Joined', v: '2024-03-12' },
    { k: 'Station', v: 'BENCH 04 · BLN' },
  ],
  tabs: [
    { ix: '§01', label: 'Profile' },
    { ix: '§02', label: 'Security' },
    { ix: '§03', label: 'Billing' },
    { ix: '§04', label: 'Printers' },
    { ix: '§05', label: 'API' },
    { ix: '§06', label: 'Notifications' },
    { ix: '§07', label: 'Export' },
    { ix: '§08', label: 'Danger Zone', danger: true },
  ],
  foot: {
    version: '3.47',
    build: '2026-05-21',
    lastDeploy: '22m AGO',
    world: '116.231.x.x · BEIJING',
  },
}

/* ------------------------------------------------------------------ */
/*  § 01.1 Identity                                                    */
/* ------------------------------------------------------------------ */

// TODO: backend integration — tags / avatar meta 需后端补
export const identityFixture = {
  tags: ['MECHA', 'PIP', 'FUNCTIONAL', 'SUPPORTS-FREE'],
  avatarMeta: [
    { k: 'FORMAT', v: 'SVG · INK' },
    { k: 'SIZE', v: '1.2 KB' },
    { k: 'UPDATED', v: '2024-03-12' },
  ],
  bioMax: 280,
}

/* ------------------------------------------------------------------ */
/*  § 01.2 Stats grid (8 cell)                                         */
/* ------------------------------------------------------------------ */

// TODO: backend integration — 8 项计量全部需后端补
export const statsGridFixture = [
  { k: 'Uploads', v: '47', delta: '+4 this month', deltaTone: 'accent' },
  { k: 'Followers', v: '14,247', delta: '+312 / week', deltaTone: 'accent' },
  { k: 'Total Downloads', v: '287,043', delta: '+8.4k / week', deltaTone: 'accent' },
  { k: 'Tips Received', v: '¥2,847', delta: '+¥412 / 30d', deltaTone: 'accent' },
  { k: 'Avg Rating', v: '4.8', vUnit: '/ 5', vEm: true, delta: '128 ratings', deltaTone: 'dim' },
  { k: 'Last Upload', v: '12', vUnit: 'd', delta: 'Mecha Dragon V3.4', deltaTone: 'dim' },
  { k: 'Revenue · MTD', v: '¥412', delta: '+18% vs Apr', deltaTone: 'accent' },
  { k: 'PIP Specimens', v: '8', delta: '3 in draft', deltaTone: 'accent' },
]

/* ------------------------------------------------------------------ */
/*  § 01.3 Activity log                                                */
/* ------------------------------------------------------------------ */

// TODO: backend integration — activity feed /user/activity 需后端补
export const activityLogFixture = [
  { date: '2026-05-21', time: '09:41', type: 'UPLOAD', typeClass: 'up', desc: '<b>Mecha Dragon V3.4</b> released to catalog · <em>FBW-2447-DRG · CC-BY-NC</em>', amt: '8.2 <b>MB</b>' },
  { date: '2026-05-20', time: '22:14', type: 'TIP', typeClass: 'tip', desc: '<b>@voxel.kid</b> sent a tip · "best PIP dragon I\'ve printed"', amt: '<b>$5.00</b>' },
  { date: '2026-05-20', time: '14:03', type: 'FOLLOW', typeClass: '', desc: '<b>12 new followers</b> · weekly batch from Dragon V3 release', amt: '<b>14,247</b> total' },
  { date: '2026-05-19', time: '11:30', type: 'COMMENT', typeClass: '', desc: '<b>@solder.fox</b> on Dragon V3.4 PIP · "any chance of an MMU-ready variant?"', amt: '<b>↩ Reply</b>' },
  { date: '2026-05-18', time: '09:00', type: 'ORDER', typeClass: '', desc: 'Bundle sold · STL + 3MF · 8.2 MB · buyer <em>@cnc.alps</em>', amt: '<b>¥99.00</b>' },
  { date: '2026-05-17', time: '18:22', type: 'CERT', typeClass: 'cert', desc: '<b>Class A</b> re-certified · annual audit passed · next 2027-05-17', amt: '+1 <b>YR</b>' },
]

export const activityLogMeta = {
  // TODO: backend integration — 总条数需后端补
  showing: 6,
  total: 218,
  window: '30D WINDOW',
}

/* ------------------------------------------------------------------ */
/*  § 01.4 Achievements                                                */
/* ------------------------------------------------------------------ */

// TODO: backend integration — achievements /user/achievements 需后端补
// badge SVG 内联在组件中 (装饰图样), 此处仅元数据
export const achievementsFixture = [
  { ix: 'A·01', badge: 'gear', title: 'Maker · Tier 3 / 4', meta: '2024 → 2026' },
  { ix: 'A·02', badge: 'shield', title: 'Dragon V3 · 8 mo', meta: 'Iteration streak' },
  { ix: 'A·03', badge: 'bolt', title: 'PIP Pioneer', meta: 'First 100 · cohort' },
  { ix: 'A·04', badge: 'star', title: 'Rating ≥ 4.5', meta: '128 ratings · 4.8' },
]

export const achievementsMeta = { shown: 4, total: 12 }

/* ------------------------------------------------------------------ */
/*  enrichProfilePc — 合并 backend userInfo + fixture                  */
/* ------------------------------------------------------------------ */

/**
 * @param {object} userInfo backend /user/info 返回 (可空)
 * @returns {object} 完整 pc dashboard view-model
 */
export function enrichProfilePc(userInfo = {}) {
  const u = userInfo || {}
  const username = u.username || 'operator'
  const handle = `@${username}`
  const displayName = u.nickname || u.username || 'Iron Forge Studio'
  const avatarText = deriveInitials(displayName)

  return {
    handle,
    displayName,
    avatarText,
    avatarSrc: u.avatar || '',
    bio: u.bio || 'iron-cast specimens · functional articulations · print-in-place specialty. 8 mo on Dragon V3. ships from BLN/BKN.',
    sidebar: {
      ...sidebarFixture,
      dossier: sidebarFixture.dossier.map((d) =>
        // TODO: backend integration — op-id 派生自 backend id
        d.k === 'OP · ID' ? { ...d, v: u.op_id || deriveOpId(u.id) } : d,
      ),
    },
    identity: identityFixture,
    stats: statsGridFixture,
    activity: { rows: activityLogFixture, meta: activityLogMeta },
    achievements: { items: achievementsFixture, meta: achievementsMeta },
    telemetry: pcTelemetryDefaults,
  }
}
