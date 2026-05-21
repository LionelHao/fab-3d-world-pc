/**
 * cd-4-desktop.html Mock Fixture (Phase 3.4 — PC GoodsDetail / Studio · Specimen Sheet)
 *
 * 用途: 在 backend `/trade/goods/:id` 接口未补齐扩展字段前 (当前仅返回 7 字段),
 * 为 PC GoodsDetail (Phase 3.4) 提供 1:1 复刻 inspiration HTML 元素密度所需的占位数据.
 *
 * 接口契约 (与 docs/design/specs/p3.4-pc-goods-detail-fixture.md §5 同步):
 *   每条 enriched item 满足 PcViewerStage / PcDetailStick / UiSpecCard (PC variant) / PcFileRow / PcRelatedCard / PcCtaStack 完整槽位 props.
 *
 * 维护规则:
 *  1. 每个 mock 字段都以 `// TODO: backend integration` 单行标注
 *  2. 当 backend 补字段后, 在对应字段移除 fallback 路径, 让 fixture 仅作 dev-only fallback
 *  3. fixture 数据**仅**用于补齐, 不能覆盖 backend 已返回的字段
 */

/* ------------------------------------------------------------------ */
/*  Brand / chrome 常量                                                */
/* ------------------------------------------------------------------ */

export const studioBrandConstants = {
  // TODO: backend integration — 暂用品牌常量, 无后端依赖
  wordmark: { left: 'FAB', divider: '/', right: '3D', tag: 'LAB' },
  appMode: 'STUDIO · BENCH 04',
  ctxDefaults: {
    session: '3h 22m',
    view: 'ORBIT 22°/-14°',
    zoom: '1.4×',
    savedState: 'Auto-saved 12s ago',
  },
  currentUserInitials: 'YO',
}

export const studioTelemetryDefaults = {
  // TODO: backend integration — POLY/DIM/MASS 接 dragonDetailFixture; FRAMES/GPU 装饰
  live: true,
  frames: '60.0 FPS',
  gpu: '22% LOAD',
}

export const viewerOverlayDefaults = {
  breadcrumb: [
    { label: 'Marketplace', href: '/market' },
    { label: 'Mecha', href: '/market?category=mecha' },
    { label: 'Dragon V3', href: null, current: true },
  ],
  // ctrl panel: 3 group × 3 btn each. svg svgId 仅作引用提示; 实现时调用方 inline svg.
  controls: {
    panelId: 'CTRL-3',
    groups: [
      {
        title: 'Navigate',
        ix: '01',
        items: [
          { id: 'orbit', kbd: 'O', label: 'Orbit', active: true },
          { id: 'pan', kbd: 'P', label: 'Pan' },
          { id: 'zoom', kbd: 'Z', label: 'Zoom' },
        ],
      },
      {
        title: 'Inspect',
        ix: '02',
        items: [
          { id: 'measure', kbd: 'M', label: 'Measure' },
          { id: 'section', kbd: 'X', label: 'Section' },
          { id: 'explode', kbd: 'E', label: 'Explode' },
        ],
      },
      {
        title: 'Display',
        ix: '03',
        items: [
          { id: 'wire', kbd: '1', label: 'Wire' },
          { id: 'shaded', kbd: '2', label: 'Shaded', active: true },
          { id: 'xray', kbd: '3', label: 'X-ray' },
        ],
      },
    ],
  },
  autoRotate: { label: 'Auto-rotate', state: 'ON', enabled: true },
  scaleRulerLabel: '10 cm',
  axisLabels: { x: 'X', y: 'Y', z: 'Z', world: 'WORLD' },
}

export const tabsDefaults = [
  { id: 'overview', label: 'Overview', ix: '01' },
  { id: 'specs', label: 'Specs', ix: '02' },
  { id: 'print', label: 'Print', ix: '03' },
  { id: 'files', label: 'Files', ix: '04' },
  { id: 'comments', label: 'Comments', ix: '05' },
]

export const tipDefaults = {
  // TODO: backend integration — tip_options 接后端 (currency aware)
  prefix: '¥',
  title: 'Tip @{handle}',
  subtitle: 'Support {months} months of iteration · 100% to maker',
  options: [
    { amount: 2 },
    { amount: 5, active: true },
    { amount: 10 },
  ],
}

/* ------------------------------------------------------------------ */
/*  派生工具 (与 cd-2-fixture 同款风格, PC 独立 copy 以避免跨包 import) */
/* ------------------------------------------------------------------ */

export function formatSampleCode(id, suffix = 'DRG') {
  const s = String(id ?? '0000')
  const tail = s.replace(/[^0-9a-zA-Z]/g, '').slice(-4).padStart(4, '0').toUpperCase()
  return `FBW-${tail}-${suffix}`
}

export function formatThousands(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('en-US')
}

export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return '— MB'
  const b = Number(bytes)
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  const mb = b / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export function formatPolygons(p) {
  if (p == null || Number.isNaN(Number(p))) return '—'
  const n = Number(p)
  if (n < 1000) return `${n}`
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  const m = n / 1_000_000
  return `${m < 10 ? m.toFixed(1) : Math.round(m)}M`
}

/* ------------------------------------------------------------------ */
/*  Dragon detail fixture (cd-4 主样例, 1:1 复刻 cd-2 + PC 额外字段)    */
/* ------------------------------------------------------------------ */

/**
 * Mecha Dragon V3 完整 PC fixture — 与 cd-4-desktop.html 一致.
 * 当 backend 还没补齐 detail 字段时, 用此完整对象兜底, 让 GoodsDetail 视觉密度对齐 anchor.
 */
export const dragonDetailFixture = {
  // 已有字段层 (与 backend `/trade/goods/:id` 同 schema)
  id: 'fbw-2447',
  title: 'Mecha Dragon',
  coverUrl: '',
  price: 0,
  description: [
    'The third revision of the Mecha Dragon series. Eight months of iteration went into the joint tolerances — every articulation point now clicks satisfyingly into position without ever binding on the bed.',
    'Prints in a single piece, supportless, on any FDM machine with at least a 180×180 bed.',
  ],
  status: 'ON_SALE',
  modelUrl: '',
  // 派生 user 块 (cd-4 d-author)
  user: {
    username: 'ironforge',
    avatar: null,
    handle: 'ironforge',
    is_maker: true, // TODO: backend integration
    followers_count: 14247, // TODO: backend integration
    joined_year: 2024, // TODO: backend integration
  },
  // 版本 / 认证 — TODO: backend integration
  version_major: 3,
  version_minor: 4,
  revision_label: 'REV 3.4',
  certified: true,
  // P0 物理参数 — TODO: backend integration
  dimensions: { w: 184, d: 92, h: 156 }, // mm
  polygons: 287_043,
  vertices_count: 144_521, // PC 独有
  volume_cm3: 152.4, // PC 独有
  surface_cm2: 446, // PC 独有
  mass_g: 188, // PC 独有 (∼)
  file_size: 8_200_000, // bytes
  file_formats: ['STL', '3MF', 'STEP', 'PDF', 'TXT'],
  license: 'CC-BY-NC',
  // P1 打印 — TODO: backend integration
  recommended_layer_mm: 0.20,
  infill_pct: 15,
  infill_pattern: 'gyroid',
  compatible_materials: ['PLA', 'PETG'],
  needs_supports: false,
  print_tech: 'FDM',
  nozzle_mm: 0.4,
  print_time_str: '14h22m', // PC 独有
  // P2 文件清单 (PC 独有) — TODO: backend integration
  files: [
    {
      format: 'STL',
      filename: 'mecha_dragon_v3.4.stl',
      description: 'Mesh · Print-in-place',
      size_bytes: 4_200_000,
      url: '',
    },
    {
      format: '3MF',
      filename: 'mecha_dragon_v3.4.3mf',
      description: 'Print profile · Bambu/Orca',
      size_bytes: 2_800_000,
      url: '',
    },
    {
      format: 'STEP',
      filename: 'mecha_dragon_v3.4_source.step',
      description: 'Parametric · Editable',
      size_bytes: 816_000,
      url: '',
    },
    {
      format: 'PDF',
      filename: 'assembly_notes.pdf',
      description: '4 pages · printable',
      size_bytes: 312_000,
      url: '',
    },
    {
      format: 'TXT',
      filename: 'CHANGELOG.txt',
      description: 'Revisions V1 → V3.4',
      size_bytes: 12_000,
      url: '',
    },
  ],
  // P2 variants (PC 独有) — TODO: backend integration
  variants: [
    { id: 'v3.4', label: 'V3.4', active: true },
    { id: 'v3.3', label: 'V3.3' },
    { id: 'slim', label: 'SLIM' },
    { id: 'mmu', label: 'MMU' },
  ],
  // P2 related (PC 独有) — TODO: backend integration
  related: [
    {
      id: 'fbw-2455',
      sample_id: '2455',
      title: 'Dragon V3 · PIP',
      likes: 12400,
      price: 'Free',
      type: 'free-model',
    },
    {
      id: 'fbw-2451',
      sample_id: '2451',
      title: 'Low-Poly Owl',
      likes: 1200,
      price: 'Free',
      type: 'free-model',
    },
    {
      id: 'fbw-2454',
      sample_id: '2454',
      title: 'Castle Keep',
      likes: 5800,
      price: 'Free',
      type: 'free-model',
    },
  ],
  // P2 social — TODO: backend integration
  iteration_months: 8,
}

/* ------------------------------------------------------------------ */
/*  enrichWithGoodsFixture: 合并 backend goods + fixture 到完整 detail */
/* ------------------------------------------------------------------ */

/**
 * 把 backend 返回的 goods 与 dragonDetailFixture 合并, 产出 GoodsDetail.vue 可直接 v-bind 的完整对象.
 *
 * 优先级: goods (backend) > fixture.
 *
 * @param {object|null} goods backend `/trade/goods/:id` 返回的对象, 或 null
 * @returns {object} enriched detail (所有 PC primitives 槽位齐全)
 */
export function enrichWithGoodsFixture(goods) {
  const fx = dragonDetailFixture
  const src = goods ?? {}
  const pick = (k) => (src[k] != null && src[k] !== '' ? src[k] : fx[k])

  const merged = {
    id: pick('id'),
    title: pick('title'),
    coverUrl: pick('coverUrl'),
    price: pick('price'),
    description: pick('description') || fx.description,
    status: pick('status'),
    modelUrl: pick('modelUrl'),
    user: src.user ? { ...fx.user, ...src.user } : fx.user,
    // 版本 / 认证
    version_major: pick('version_major'),
    version_minor: pick('version_minor'),
    revision_label: pick('revision_label'),
    certified: pick('certified'),
    // 物理
    dimensions: pick('dimensions'),
    polygons: pick('polygons'),
    vertices_count: pick('vertices_count'),
    volume_cm3: pick('volume_cm3'),
    surface_cm2: pick('surface_cm2'),
    mass_g: pick('mass_g'),
    file_size: pick('file_size'),
    file_formats: pick('file_formats'),
    license: pick('license'),
    // 打印
    recommended_layer_mm: pick('recommended_layer_mm'),
    infill_pct: pick('infill_pct'),
    infill_pattern: pick('infill_pattern'),
    compatible_materials: pick('compatible_materials'),
    needs_supports: pick('needs_supports'),
    print_tech: pick('print_tech'),
    nozzle_mm: pick('nozzle_mm'),
    print_time_str: pick('print_time_str'),
    // 列表
    files: Array.isArray(src.files) && src.files.length > 0 ? src.files : fx.files,
    variants: Array.isArray(src.variants) && src.variants.length > 0 ? src.variants : fx.variants,
    related: Array.isArray(src.related) && src.related.length > 0 ? src.related : fx.related,
    iteration_months: pick('iteration_months'),
  }

  // 派生槽位
  merged.sampleCode = formatSampleCode(merged.id)
  merged.fileSizeStr = formatFileSize(merged.file_size)
  merged.polygonsStr = formatPolygons(merged.polygons)
  merged.dimText = merged.dimensions
    ? `${merged.dimensions.w} × ${merged.dimensions.d} × ${merged.dimensions.h} MM`
    : '—'
  merged.massText = merged.mass_g != null ? `~${merged.mass_g} G` : '—'
  merged.polygonsLong = formatThousands(merged.polygons)
  merged.verticesLong = formatThousands(merged.vertices_count)

  return merged
}
