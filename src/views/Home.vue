<script setup>
/**
 * Home.vue — PC Home 装配 (Phase 3.2 anchor，1:1 复刻 cd-3-desktop.html)
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.1 ~ §1.8
 * Anchor: docs/design/inspiration/cd-3-desktop.html
 *
 * 业务接口 (零修改): getPosts(number, page) → res.postCoverInfoList
 * Fixture fallback: src/mocks/cd-3-fixture.js
 */
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as OV from 'online-3d-viewer/build/engine/o3dv.module.js'
import { attachViewerSoul } from '@/utils/viewerSoul.js'
import { ElMessage } from 'element-plus'

import { getPosts } from '@/service/content'

import PcNavbar from '@/components/PcNavbar.vue'
import PcTelemetryStrip from '@/components/PcTelemetryStrip.vue'
import PcSectionHeader from '@/components/PcSectionHeader.vue'
import PcFooter from '@/components/PcFooter.vue'
import PcHeroPlate from '@/components/home/PcHeroPlate.vue'
import PcHeroCopy from '@/components/home/PcHeroCopy.vue'
import PcMakerCard from '@/components/home/PcMakerCard.vue'
import PcFarmCard from '@/components/home/PcFarmCard.vue'

import UiChip from '@/components/ui/UiChip.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiReveal from '@/components/ui/UiReveal.vue'

import {
  brandConstants,
  navLinks,
  telemetryDefaults,
  searchDefaults,
  localePack,
  chipCategories,
  sectionHeaders,
  heroFixture,
  gridFixtures,
  makerFixtures,
  farmFixtures,
  footerColumns,
  socialLinks,
  footerBottom,
  enrichWithFixture,
} from '@/mocks/cd-3-fixture'

const router = useRouter()
const { t } = useI18n()

const searchValue = ref('')
const activeChipId = ref('all')
const bookmarkedSet = ref(new Set(gridFixtures.filter((g) => g.bookmarked).map((g) => g.postId)))
const followingSet = ref(new Set(makerFixtures.filter((m) => m.following).map((m) => m.opId)))

const posts = ref([])
const loading = ref(false)

const enrichedGrid = computed(() => {
  const raws = posts.value.length ? posts.value : gridFixtures
  return raws.slice(0, 8).map((item, i) => {
    const base = posts.value.length
      ? enrichWithFixture(item, i)
      : { ...gridFixtures[i] }
    return {
      ...base,
      bookmarked: bookmarkedSet.value.has(base.postId),
    }
  })
})

const makers = computed(() =>
  makerFixtures.map((m) => ({ ...m, following: followingSet.value.has(m.opId) }))
)

const farmJobs = computed(() => farmFixtures)

/* ─── Hero 3D viewer (Phase 4 T4.3: PcHeroPlate render slot 挂真 viewer) ─── */
const heroPlateRef = ref(null)
let heroViewer = null
let heroSoul = null
let heroIO = null
let isHeroHovered = false

function initHeroViewer() {
  const container = heroPlateRef.value?.canvasRef
  if (!container || heroViewer) return
  try {
    heroViewer = new OV.EmbeddedViewer(container, {
      onModelLoaded: () => {
        if (heroSoul) heroSoul.restart()
        else heroSoul = attachViewerSoul(heroViewer)
      },
    })
    heroViewer.LoadModelFromUrlList([heroFixture.modelUrl])
  } catch (err) {
    console.error('[Home] hero viewer 初始化失败:', err)
  }
}

/* Phase 4 T4.4: hover 视差 — 进入停自转，相机 eye 随光标轻微偏移 */
function onHeroPointerEnter() {
  isHeroHovered = true
  heroSoul?.pause()
}
function onHeroPointerLeave() {
  isHeroHovered = false
  heroSoul?.setParallax(0, 0)
  heroSoul?.resume()
}
function onHeroPointerMove(e) {
  if (!heroSoul || !isHeroHovered) return
  const r = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 2 - 1
  const y = ((e.clientY - r.top) / r.height) * 2 - 1
  heroSoul.setParallax(x, -y) // -y: 光标上移 → 视角上抬
}

/* Phase 4 T4.4: 滚动联动 — 非 hover 时 hero 滚出视口驱动相机俯仰角 */
function setupHeroScrollLink() {
  const el = heroPlateRef.value?.canvasRef
  if (!el || heroIO) return
  heroIO = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (!e || !heroSoul || isHeroHovered) return
      heroSoul.setParallax(0, (1 - e.intersectionRatio) * 0.7)
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  )
  heroIO.observe(el)
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await getPosts(8, 1)
    posts.value = res?.postCoverInfoList || []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
  // hero 3D viewer 初始化（DOM 已 mount，与 backend 拉取解耦）
  await nextTick()
  initHeroViewer()
  setupHeroScrollLink()
})

onUnmounted(() => {
  heroIO?.disconnect()
  heroIO = null
  heroSoul?.dispose()
  heroSoul = null
  heroViewer = null
})

/* ─── i18n: localized chrome/section/footer derived from fixtures ─── */
const NAV_KEYS = { catalog: 'home.nav.catalog', market: 'home.nav.market', studio: 'home.nav.studio', lab_log: 'home.nav.labLog' }
const localizedNavLinks = computed(() =>
  navLinks.map((l) => ({ ...l, label: NAV_KEYS[l.id] ? t(NAV_KEYS[l.id]) : l.label }))
)
const localizedSearch = computed(() => ({
  ...searchDefaults,
  label: t('home.search.label'),
  placeholder: t('home.search.placeholder'),
}))
const localizedSectionHeaders = computed(() => ({
  trending:   { ...sectionHeaders.trending,   title: t('home.sections.trending.title'),   sub: t('home.sections.trending.sub'),   cta: t('home.sections.trending.cta') },
  operators:  { ...sectionHeaders.operators,  title: t('home.sections.operators.title'),  sub: t('home.sections.operators.sub'),  cta: t('home.sections.operators.cta') },
  print_farm: { ...sectionHeaders.print_farm, title: t('home.sections.printFarm.title'),  sub: t('home.sections.printFarm.sub'),  cta: t('home.sections.printFarm.cta') },
}))
const localizedHeroScrollHint = computed(() => t('home.hero.scrollHint'))
const FOOTER_COL_KEYS = ['explore', 'create', 'company', 'legal']
const FOOTER_LINK_KEYS = {
  explore: { '/home': 'catalog', '/market': 'marketplace', '#collections': 'collections', '#operators': 'operators', '#farm': 'printFarm' },
  create: { '/publish': 'logSample', '/studio': 'studio', '#maker': 'makerProgram', '#guide': 'designGuide' },
  company: { '#about': 'about', '/log': 'labLog', '#press': 'pressKit', '#careers': 'careers', '#contact': 'contact' },
  legal: { '#terms': 'terms', '#privacy': 'privacy', '#licenses': 'licenses', '#dmca': 'dmca' },
}
const localizedFooterColumns = computed(() =>
  footerColumns.map((col, idx) => {
    const key = FOOTER_COL_KEYS[idx]
    const linkMap = FOOTER_LINK_KEYS[key] || {}
    return {
      ...col,
      heading: t(`home.footer.columns.${key}.heading`),
      links: col.links.map((link, i) => {
        // 按列内位置取 link key（fixture 顺序与 zh/en JSON 顺序对齐）
        const linkKeys = Object.values(linkMap)
        const lk = linkKeys[i]
        return { ...link, label: lk ? t(`home.footer.columns.${key}.links.${lk}`) : link.label }
      }),
    }
  })
)
const localizedFooterBottom = computed(() => ({
  ...footerBottom,
  networkStatus: t('home.footer.networkStatusNominal'),
}))

const onLogoClick = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const onNavClick = (link) => {
  if (link.id === 'studio' || link.id === 'lab_log') {
    ElMessage.info(t('home.toast.navigateMock', { label: link.label }))
  }
}
const onSearch = (v) => ElMessage.info(t('home.toast.searchMock', { query: v || t('home.toast.searchEmpty') }))
const onLocaleClick = () => ElMessage.info(t('home.toast.localePickerMock'))
const onBellClick = () => ElMessage.info(t('home.toast.notificationsMock'))
const onUploadClick = () => {
  router.push('/publish').catch(() => ElMessage.info(t('home.toast.publishMock')))
}
const onAvatarClick = () => router.push('/profile').catch(() => {})

const onChipClick = (chip) => {
  activeChipId.value = chip.id
  ElMessage.info(t('home.toast.filterMock', { label: chip.label }))
}

const onHeroDownload = () => ElMessage.success(t('home.toast.downloadStarted'))
const onHeroStudio = () => ElMessage.info(t('home.toast.openInStudioMock'))

const onCardClick = (postId) => router.push(`/post/${postId}`).catch(() => {})
const onBookmarkToggle = (postId, next) => {
  const set = new Set(bookmarkedSet.value)
  if (next) set.add(postId)
  else set.delete(postId)
  bookmarkedSet.value = set
}

const onFollowToggle = (opId, next) => {
  const set = new Set(followingSet.value)
  if (next) set.add(opId)
  else set.delete(opId)
  followingSet.value = set
}

const onSeeAllTrending = () => router.push('/market').catch(() => ElMessage.info(t('home.toast.browseAllMock')))
const onSeeAllOperators = () => ElMessage.info(t('home.toast.fullLeaderboardMock'))
const onSeeAllFarm = () => ElMessage.info(t('home.toast.allPrintersMock'))

const onFooterLink = (link) => ElMessage.info(t('home.toast.footerMock', { label: link.label }))
const onFooterSocial = (s) => ElMessage.info(t('home.toast.socialMock', { label: s.label }))
const onFooterLogo = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <div class="pc-home">
    <PcNavbar
      v-model:search-value="searchValue"
      :nav-links="localizedNavLinks"
      :brand="brandConstants"
      :search="localizedSearch"
      :locale="localePack"
      :bell-badge="true"
      @logo-click="onLogoClick"
      @nav-click="onNavClick"
      @search="onSearch"
      @locale-click="onLocaleClick"
      @bell-click="onBellClick"
      @upload-click="onUploadClick"
      @avatar-click="onAvatarClick"
    />

    <PcTelemetryStrip :data="telemetryDefaults" />

    <section class="pc-home__hero">
      <div class="pc-home__hero-inner">
        <PcHeroPlate
          ref="heroPlateRef"
          :data="heroFixture.plate"
          :sample-code="heroFixture.sampleCode"
          :rev="heroFixture.rev"
          :sample-class="heroFixture.sampleClass"
          :certified="heroFixture.certified"
          :has-viewer="true"
          @pointerenter="onHeroPointerEnter"
          @pointerleave="onHeroPointerLeave"
          @pointermove="onHeroPointerMove"
        />
        <PcHeroCopy
          :hero="heroFixture"
          @download-click="onHeroDownload"
          @studio-click="onHeroStudio"
        />
      </div>
      <div class="pc-home__scroll-hint">
        {{ localizedHeroScrollHint }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6"/>
        </svg>
      </div>
    </section>

    <UiReveal as="section" class="pc-home__block" :delay="0">
      <PcSectionHeader
        :num="localizedSectionHeaders.trending.num"
        :title="localizedSectionHeaders.trending.title"
        :sub="localizedSectionHeaders.trending.sub"
        :cta="localizedSectionHeaders.trending.cta"
        @cta-click="onSeeAllTrending"
      />

      <div class="pc-home__chips">
        <UiChip
          v-for="chip in chipCategories"
          :key="chip.id"
          :label="chip.label"
          :index-label="chip.ix"
          :count="chip.count.toLocaleString('en-US')"
          :active="chip.id === activeChipId"
          size="lg"
          @click="onChipClick(chip)"
        />
      </div>

      <div class="pc-home__grid">
        <UiCard
          v-for="(card, i) in enrichedGrid"
          :key="card.postId || i"
          :sample-code="card.sampleCode"
          :title="card.title"
          :author="card.author"
          :specs="card.specs"
          :price="card.price"
          :stats="card.stats"
          :scale-label="card.scaleLabel"
          :bookmarked="card.bookmarked"
          :cover-url="card.coverUrl"
          @click="onCardClick(card.postId)"
          @bookmark-toggle="onBookmarkToggle(card.postId, $event)"
        />
      </div>
    </UiReveal>

    <UiReveal as="section" class="pc-home__block" :delay="80">
      <PcSectionHeader
        :num="localizedSectionHeaders.operators.num"
        :title="localizedSectionHeaders.operators.title"
        :sub="localizedSectionHeaders.operators.sub"
        :cta="localizedSectionHeaders.operators.cta"
        @cta-click="onSeeAllOperators"
      />
      <div class="pc-home__makers">
        <PcMakerCard
          v-for="m in makers"
          :key="m.opId"
          :maker="m"
          @follow-toggle="onFollowToggle(m.opId, $event)"
        />
      </div>
    </UiReveal>

    <UiReveal as="section" class="pc-home__block" :delay="160">
      <PcSectionHeader
        :num="localizedSectionHeaders.print_farm.num"
        :title="localizedSectionHeaders.print_farm.title"
        :sub="localizedSectionHeaders.print_farm.sub"
        :cta="localizedSectionHeaders.print_farm.cta"
        @cta-click="onSeeAllFarm"
      />
      <div class="pc-home__farm-wrap">
        <div class="pc-home__farm">
          <PcFarmCard
            v-for="(job, i) in farmJobs"
            :key="i"
            :job="job"
          />
        </div>
      </div>
    </UiReveal>

    <PcFooter
      :brand="brandConstants"
      :columns="localizedFooterColumns"
      :social="socialLinks"
      :bottom="localizedFooterBottom"
      @logo-click="onFooterLogo"
      @link-click="onFooterLink"
      @social-click="onFooterSocial"
    />
  </div>
</template>

<style scoped>
.pc-home {
  min-width: 1440px;
  background: var(--paper);
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to right, color-mix(in srgb, var(--ink) 1.8%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 1.8%, transparent) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
  font-family: var(--f-sans);
  color: var(--ink);
}

.pc-home__hero {
  position: relative;
  height: 720px;
  border-bottom: 1.5px solid var(--ink);
  overflow: hidden;
}
.pc-home__hero-inner {
  width: 1280px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: 55% 45%;
  align-items: stretch;
  gap: 32px;
  padding: 32px 0;
}
.pc-home__scroll-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  animation: pc-home-bounce 1.4s ease-in-out infinite;
}
.pc-home__scroll-hint svg { width: 14px; height: 14px; }
@keyframes pc-home-bounce {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, 4px); }
}

.pc-home__block {
  padding: 48px 0 16px;
}

.pc-home__chips {
  width: 1280px;
  margin: 0 auto 24px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pc-home__grid {
  width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pc-home__makers {
  width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.pc-home__farm-wrap {
  width: 1280px;
  margin: 0 auto;
  overflow-x: auto;
}
.pc-home__farm {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
}
.pc-home__farm > * {
  flex: 1 1 0;
  min-width: 240px;
}
</style>
