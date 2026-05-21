/**
 * cd-3-desktop.html Mock Fixture
 *
 * 用途: 在 backend `/content/posts` 接口未补齐扩展字段前, 为 PC Home (Phase 3.2)
 * 提供 1:1 复刻 inspiration HTML 元素密度所需的占位数据.
 *
 * 接口契约 (与 docs/design/specs/p3.2-pc-home-fixture.md §5 同步):
 *   - heroFixture / gridFixtures: 与 mobile cd-1 字段同源 (UiCard 槽位)
 *   - makerFixtures: PC 独有 (TOP MAKERS 段, mobile 无)
 *   - farmFixtures:  PC 独有 (PRINT FARM 段, mobile 无)
 *   - footerColumns: PC 独有 (4 列 footer)
 *
 * 维护规则:
 *  1. 每个 mock 字段都以 `// TODO: backend integration` 单行标注
 *  2. backend 补字段后, 在对应字段移除 fallback, 让 fixture 仅作 dev-only fallback
 *  3. fixture 数据**仅**用于补齐, 不能覆盖 backend 已返回字段
 */

/* ------------------------------------------------------------------ */
/*  品牌 / chrome 常量                                                  */
/* ------------------------------------------------------------------ */

export const brandConstants = {
  // TODO: backend integration — 装饰常量, 无后端依赖
  wordmark: { left: 'FAB', divider: '/', right: '3D', tag: 'LAB' },
  subtitle: 'Laboratory of Printable Geometries',
  build: 'BUILD 3.47.0',
  buildLocations: 'BERLIN ⇌ BROOKLYN',
  status: 'NOMINAL',
  uptime: '99.98%',
  footerEof: 'EOF · CATALOG/V3.47',
  footerCopy: '© 2026 FAB 3D LAB, INC.',
}

export const navLinks = [
  // TODO: backend integration — 路由表本地常量, 无后端
  { id: 'catalog',   ix: '01', label: 'Catalog',  route: '/home',    active: true },
  { id: 'market',    ix: '02', label: 'Market',   route: '/market' },
  { id: 'studio',    ix: '03', label: 'Studio',   route: '/studio' },
  { id: 'lab_log',   ix: '04', label: 'Lab Log',  route: '/log' },
]

export const telemetryDefaults = {
  // TODO: backend integration — NETWORK/FARM/SAMPLES 需 backend 实时计数, 暂硬编码
  live: true,
  network: { value: '4,128', unit: 'MAKERS' },
  farm:    { value: '142',   unit: 'ACTIVE' },
  samples: { value: '482,164' },
  rev:     '3.47',
  syncMs:  380,
}

export const searchDefaults = {
  label: 'QUERY',
  placeholder: 'search 482,164 specimens, makers, collections…',
  kbd: '⌘ K',
}

export const localePack = {
  // TODO: backend integration — 需 i18n + 货币服务
  flag: 'us',
  display: 'EN · USD',
  locale: 'EN-US',
  currency: 'USD',
  symbol: '$',
}

export const chipCategories = [
  // TODO: backend integration — 需 /content/categories API
  { id: 'all',      ix: '00', label: 'All',      count: 2841, active: true },
  { id: 'toys',     ix: '01', label: 'Toys',     count: 412 },
  { id: 'home',     ix: '02', label: 'Home',     count: 684 },
  { id: 'tools',    ix: '03', label: 'Tools',    count: 256 },
  { id: 'fashion',  ix: '04', label: 'Fashion',  count: 128 },
  { id: 'tech',     ix: '05', label: 'Tech',     count: 540 },
  { id: 'tabletop', ix: '06', label: 'Tabletop', count: 388 },
  { id: 'cosplay',  ix: '07', label: 'Cosplay',  count: 214 },
]

export const sectionHeaders = {
  trending:   { num: '§ 01', title: 'Trending This Week',     sub: 'Updated 9:41 AM · refresh 60min', cta: 'Browse all' },
  operators:  { num: '§ 02', title: 'Operators · Top of Month', sub: 'By prints generated · ranked',    cta: 'Full Leaderboard' },
  print_farm: { num: '§ 03', title: 'Print Farm · Live Telemetry', sub: '142 jobs running · streamed',   cta: 'All printers' },
}

/* ------------------------------------------------------------------ */
/*  Sample code formatter (沿用 cd-1 约定)                              */
/* ------------------------------------------------------------------ */

/**
 * 把 backend postId 派生为 inspiration 风格的 sample code.
 * 例: postId='aef-2447' + type='free-model' → 'FBW-2447-FRE'
 *
 * @param {string|number} postId
 * @param {string} type one of 'image'|'video'|'paid-model'|'free-model'
 * @returns {string}
 */
export function formatSampleCode(postId, type) {
  const id = String(postId ?? '0000')
  const tail = id.replace(/[^0-9a-zA-Z]/g, '').slice(-4).padStart(4, '0').toUpperCase()
  const suffix = {
    'image': 'IMG',
    'video': 'VID',
    'paid-model': 'PRO',
    'free-model': 'FRE',
  }[type] || 'GEN'
  return `FBW-${tail}-${suffix}`
}

/**
 * @param {string} type
 * @returns {{ label: string, paid: boolean }}
 */
export function derivePrice(type) {
  if (type === 'paid-model') {
    return { label: '$2.49', paid: true } // TODO: backend integration — 真价格字段缺
  }
  return { label: 'Free', paid: false }
}

/* ------------------------------------------------------------------ */
/*  HERO — specimen plate + editorial copy                              */
/* ------------------------------------------------------------------ */

/**
 * Hero 卡片 mock — 当 backend list 首条返回时用其真实字段; 否则用此 fallback.
 * 与 cd-3-desktop.html line 1369-1595 的 `.hero` 段 1:1 对齐.
 */
export const heroFixture = {
  postId: 'fbw-2447-drg',
  coverUrl: '',
  modelUrl: '/models/sample-gear.stl', // TODO: backend integration — Phase 4 T4.3 hero 3D fixture 兜底
  title: 'Mecha Dragon V3.4',
  type: 'free-model',

  // 派生 mock
  sampleCode: 'FBW-2447-DRG',
  sampleClass: 'A',
  certified: true,
  rev: '3.4',

  eyebrow: 'Staff Pick · Week 21',

  plate: {
    // plate-readout 左右两列
    // TODO: backend integration — 物理参数 backend 缺
    figure: 'FIG. 01 · ARTICULATED',
    scale:  'SCALE 1:1 · ORBIT 22°/-14°',
    dim:    'DIM 184 × 92 × 156 MM',
    mass:   '188 G',
    poly:   '287,043',
    parts:  '32',
    annotations: [
      { id: 'A', label: 'A · OCULAR ARRAY' },
      { id: 'B', label: 'B · DORSAL PLATE' },
      { id: 'C', label: 'C · THRUSTER' },
    ],
    scaleRulerLabel: '15 cm',
  },

  body: [
    'The third revision of the Mecha Dragon series. Every articulation now clicks satisfyingly into position — no binding, no glue, no supports. Prints straight off the bed in a single piece.',
    'Designed for stock PLA shrinkage with 0.30mm joint clearances. Includes a hidden magnet cavity in the lower jaw — drop in a 5mm magnet pre-print and it sticks to any steel surface.',
  ],

  author: {
    // TODO: backend integration
    handle: '@ironforge',
    initials: 'IF',
    badge: 'Maker',
  },

  stats: {
    // TODO: backend integration
    likes:     3421,
    downloads: 12847,
    prints:    482,
  },

  cta: {
    primary:   { label: 'Download STL', size: '8.2 MB' },
    secondary: { label: 'Open in Studio' },
  },

  scrollHint: 'Scroll to explore',
}

/* ------------------------------------------------------------------ */
/*  GRID — TRENDING 8 cards                                             */
/* ------------------------------------------------------------------ */

/**
 * 8 张卡片 fixture — 当 backend list 不足或缺字段时, 按 index 顺序补.
 * 与 cd-3-desktop.html line 1623-1958 的 8 张 `.card` 1:1 对齐.
 */
export const gridFixtures = [
  {
    postId: 'fbw-2448-hex',
    coverUrl: '',
    title: 'Hex Planter · Modular Snap',
    type: 'free-model',
    sampleCode: 'FBW-2448-HEX',
    specs: { dim: '96×96×140mm', mass: '74g', time: '6h12m' },
    author: { handle: '@mossroot.studio' },
    price: { label: 'Free', paid: false },
    stats: { likes: 3100, downloads: 1900 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2449-std',
    coverUrl: '',
    title: 'Adjustable Desk Stand · Phone',
    type: 'paid-model',
    sampleCode: 'FBW-2449-STD',
    specs: { dim: '112×62×88mm', mass: '52g', time: '3h44m' },
    author: { handle: '@kobold.cad' },
    price: { label: '$2.49', paid: true },
    stats: { likes: 921, downloads: 612 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2450-vas',
    coverUrl: '',
    title: 'Faceted Vase No. 04 · Vase Mode',
    type: 'free-model',
    sampleCode: 'FBW-2450-VAS',
    specs: { dim: '84×84×210mm', mass: '112g', time: '8h05m' },
    author: { handle: '@lattice.print' },
    price: { label: 'Free', paid: false },
    stats: { likes: 4700, downloads: 2300 },
    bookmarked: true,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2452-bin',
    coverUrl: '',
    title: 'Modular Desk Bins · 42mm Grid',
    type: 'free-model',
    sampleCode: 'FBW-2452-BIN',
    specs: { dim: '168×84×42mm', mass: '96g', time: '5h18m' },
    author: { handle: '@bench.rat' },
    price: { label: 'Free', paid: false },
    stats: { likes: 28600, downloads: 19400 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2451-owl',
    coverUrl: '',
    title: 'Low-Poly Owl · No Supports',
    type: 'free-model',
    sampleCode: 'FBW-2451-OWL',
    specs: { dim: '62×54×80mm', mass: '38g', time: '2h31m' },
    author: { handle: '@polybeak' },
    price: { label: 'Free', paid: false },
    stats: { likes: 1200, downloads: 847 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2453-spn',
    coverUrl: '',
    title: 'Adjustable Spanner · Functional',
    type: 'paid-model',
    sampleCode: 'FBW-2453-SPN',
    specs: { dim: '148×34×6mm', mass: '22g', time: '1h12m' },
    author: { handle: '@coldkerf' },
    price: { label: '$1.00', paid: true },
    stats: { likes: 612, downloads: 388 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2454-kep',
    coverUrl: '',
    title: 'Tabletop Castle Keep · 28mm',
    type: 'free-model',
    sampleCode: 'FBW-2454-KEP',
    specs: { dim: '156×120×138mm', mass: '184g' },
    author: { handle: '@rookvale' },
    price: { label: 'Free', paid: false },
    stats: { likes: 5800, downloads: 4100 },
    bookmarked: false,
    scaleLabel: '5cm',
  },
  {
    postId: 'fbw-2455-drg',
    coverUrl: '',
    title: 'Articulated Dragon V3 · PIP',
    type: 'free-model',
    sampleCode: 'FBW-2455-DRG',
    specs: { dim: '214×54×42mm', mass: '188g', time: '14h22m' },
    author: { handle: '@ironforge' },
    price: { label: 'Free', paid: false },
    stats: { likes: 12400, downloads: 8200 },
    bookmarked: true,
    scaleLabel: '5cm',
  },
]

/* ------------------------------------------------------------------ */
/*  TOP MAKERS — 5 maker cards (PC 独有)                                */
/* ------------------------------------------------------------------ */

export const makerFixtures = [
  // TODO: backend integration — 需 /user/leaderboard?period=month API
  {
    rank: 1, opId: 'OP-0042',
    handle: '@ironforge', initials: 'IF', avatarBg: 'hilite', avatarInk: 'ink',
    badge: 'Maker',
    stats: { foll: '14.2k', models: '87' },
    following: true,
  },
  {
    rank: 2, opId: 'OP-0118',
    handle: '@mossroot.studio', initials: 'MS', avatarBg: 'paper-2', avatarInk: 'accent',
    badge: null,
    stats: { foll: '8.9k', models: '54' },
    following: false,
  },
  {
    rank: 3, opId: 'OP-0007',
    handle: '@bench.rat', initials: 'BR', avatarBg: 'ink', avatarInk: 'hilite',
    badge: 'Maker',
    stats: { foll: '42.1k', models: '312' },
    following: false,
  },
  {
    rank: 4, opId: 'OP-0231',
    handle: '@lattice.print', initials: 'LP', avatarBg: 'paper-3', avatarInk: 'ink',
    badge: null,
    stats: { foll: '6.4k', models: '41' },
    following: false,
  },
  {
    rank: 5, opId: 'OP-0089',
    handle: '@kobold.cad', initials: 'KO', avatarBg: 'paper-2', avatarInk: 'accent',
    badge: 'Maker',
    stats: { foll: '11.7k', models: '168' },
    following: false,
  },
]

/* ------------------------------------------------------------------ */
/*  PRINT FARM — 5 live job cards (PC 独有)                             */
/* ------------------------------------------------------------------ */

export const farmFixtures = [
  // TODO: backend integration — 需 /farm/jobs?live=1 + WebSocket 实时推送
  {
    cam: 'CAM 03', printerModel: 'P1S', jobId: '#4471',
    title: 'Articulated Dragon V3',
    printingFor: '@voxel.kid',
    progressPct: 42, etaText: '4h 12m',
    specs: { layerHeight: '0.20mm', infill: '15% gyroid', material: 'PLA', color: 'chartreuse' },
  },
  {
    cam: 'CAM 01', printerModel: 'X1C', jobId: '#1209',
    title: 'Faceted Vase No. 04',
    printingFor: '@solder.fox',
    progressPct: 68, etaText: '2h 38m',
    specs: { layerHeight: '0.16mm', infill: 'vase mode', material: 'PETG', color: 'charcoal' },
  },
  {
    cam: 'CAM 07', printerModel: 'P1S', jobId: '#0832',
    title: 'Modular Desk Bins (×6)',
    printingFor: '@bench.rat',
    progressPct: 12, etaText: '9h 47m',
    specs: { layerHeight: '0.20mm', infill: '40% gyroid', material: 'PLA', color: 'matte black' },
  },
  {
    cam: 'CAM 02', printerModel: 'A1 mini', jobId: '#2207',
    title: 'Low-Poly Owl',
    printingFor: '@polybeak',
    progressPct: 87, etaText: '18m',
    specs: { layerHeight: '0.20mm', infill: '15% gyroid', material: 'PLA', color: 'bronze' },
  },
  {
    cam: 'CAM 04', printerModel: 'P1S', jobId: '#5512',
    title: 'Tabletop Castle Keep',
    printingFor: '@rookvale',
    progressPct: 23, etaText: '7h 04m',
    specs: { layerHeight: '0.28mm', infill: '10% grid', material: 'PLA', color: 'grey' },
  },
]

/* ------------------------------------------------------------------ */
/*  FOOTER — brand block + 4 columns + bottom strip                     */
/* ------------------------------------------------------------------ */

export const footerColumns = [
  // TODO: backend integration — 链接表 PM-owned static, 无后端
  {
    heading: 'Explore',
    links: [
      { label: 'Catalog',     href: '/home' },
      { label: 'Marketplace', href: '/market' },
      { label: 'Collections', href: '#' },
      { label: 'Operators',   href: '#' },
      { label: 'Print Farm',  href: '#' },
    ],
  },
  {
    heading: 'Create',
    links: [
      { label: 'Log a sample',       href: '/publish' },
      { label: 'Studio (web slicer)', href: '/studio' },
      { label: 'Maker program',      href: '#' },
      { label: 'Design guide',       href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',           href: '#' },
      { label: 'Lab Log (Blog)',  href: '/log' },
      { label: 'Press kit',       href: '#' },
      { label: 'Careers',         href: '#' },
      { label: 'Contact',         href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms',    href: '#' },
      { label: 'Privacy',  href: '#' },
      { label: 'Licenses', href: '#' },
      { label: 'DMCA',     href: '#' },
    ],
  },
]

export const socialLinks = [
  { id: 'instagram', label: 'Instagram', href: '#' },
  { id: 'x',         label: 'X',         href: '#' },
  { id: 'discord',   label: 'Discord',   href: '#' },
  { id: 'github',    label: 'GitHub',    href: '#' },
]

export const footerBottom = {
  eof: 'EOF · CATALOG/V3.47 · © 2026 FAB 3D LAB, INC.',
  locale: 'EN-US · USD $',
  networkStatus: 'NETWORK NOMINAL',
}

/* ------------------------------------------------------------------ */
/*  enrichWithFixture: backend item → UiCard PC 完整 props              */
/* ------------------------------------------------------------------ */

/**
 * 把 backend `PostCoverInfo` (postId/coverUrl/title/content/type) 合并 fixture
 * 扩展字段, 返回 PC UiCard 直接可消费的完整 props.
 *
 * @param {Object} backendItem
 * @param {number} index
 * @returns {Object}
 */
export function enrichWithFixture(backendItem, index) {
  const fixture = gridFixtures[index % gridFixtures.length]
  const postId = backendItem.id ?? backendItem.postId ?? fixture.postId
  const type = backendItem.type ?? fixture.type

  return {
    postId,
    type,
    coverUrl: backendItem.src ?? backendItem.coverUrl ?? fixture.coverUrl,
    title: backendItem.title ?? fixture.title,

    sampleCode: formatSampleCode(postId, type),

    specs:  fixture.specs,      // TODO: backend integration
    author: fixture.author,     // TODO: backend integration
    price:  derivePrice(type),
    stats:  fixture.stats,      // TODO: backend integration

    bookmarked: fixture.bookmarked ?? false, // local UI state, eventually need /user/saved API
    scaleLabel: fixture.scaleLabel ?? '5cm',
  }
}

/* ------------------------------------------------------------------ */
/*  汇总导出                                                            */
/* ------------------------------------------------------------------ */

export const cdThreeFixture = {
  brand:     brandConstants,
  nav:       navLinks,
  telemetry: telemetryDefaults,
  search:    searchDefaults,
  locale:    localePack,
  chips:     chipCategories,
  sections:  sectionHeaders,
  hero:      heroFixture,
  grid:      gridFixtures,
  makers:    makerFixtures,
  farm:      farmFixtures,
  footer:    { columns: footerColumns, social: socialLinks, bottom: footerBottom },
}

export default cdThreeFixture
