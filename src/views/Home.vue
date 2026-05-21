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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
})

const onLogoClick = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const onNavClick = (link) => {
  if (link.id === 'studio' || link.id === 'lab_log') {
    ElMessage.info(`Navigate · ${link.label} (mock)`)
  }
}
const onSearch = (v) => ElMessage.info(`Search · "${v || '(empty)'}"`)
const onLocaleClick = () => ElMessage.info('Locale picker (mock)')
const onBellClick = () => ElMessage.info('Notifications (mock)')
const onUploadClick = () => {
  router.push('/publish').catch(() => ElMessage.info('Publish (mock)'))
}
const onAvatarClick = () => router.push('/profile').catch(() => {})

const onChipClick = (chip) => {
  activeChipId.value = chip.id
  ElMessage.info(`Filter · ${chip.label}`)
}

const onHeroDownload = () => ElMessage.success('Download STL · started (mock)')
const onHeroStudio = () => ElMessage.info('Open in Studio (mock)')

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

const onSeeAllTrending = () => router.push('/market').catch(() => ElMessage.info('Browse all (mock)'))
const onSeeAllOperators = () => ElMessage.info('Full Leaderboard (mock)')
const onSeeAllFarm = () => ElMessage.info('All printers (mock)')

const onFooterLink = (link) => ElMessage.info(`Footer · ${link.label}`)
const onFooterSocial = (s) => ElMessage.info(`Social · ${s.label}`)
const onFooterLogo = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <div class="pc-home">
    <PcNavbar
      v-model:search-value="searchValue"
      :nav-links="navLinks"
      :brand="brandConstants"
      :search="searchDefaults"
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
          :data="heroFixture.plate"
          :sample-code="heroFixture.sampleCode"
          :rev="heroFixture.rev"
          :sample-class="heroFixture.sampleClass"
          :certified="heroFixture.certified"
        />
        <PcHeroCopy
          :hero="heroFixture"
          @download-click="onHeroDownload"
          @studio-click="onHeroStudio"
        />
      </div>
      <div class="pc-home__scroll-hint">
        {{ heroFixture.scrollHint }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6"/>
        </svg>
      </div>
    </section>

    <section class="pc-home__block">
      <PcSectionHeader
        :num="sectionHeaders.trending.num"
        :title="sectionHeaders.trending.title"
        :sub="sectionHeaders.trending.sub"
        :cta="sectionHeaders.trending.cta"
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
    </section>

    <section class="pc-home__block">
      <PcSectionHeader
        :num="sectionHeaders.operators.num"
        :title="sectionHeaders.operators.title"
        :sub="sectionHeaders.operators.sub"
        :cta="sectionHeaders.operators.cta"
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
    </section>

    <section class="pc-home__block">
      <PcSectionHeader
        :num="sectionHeaders.print_farm.num"
        :title="sectionHeaders.print_farm.title"
        :sub="sectionHeaders.print_farm.sub"
        :cta="sectionHeaders.print_farm.cta"
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
    </section>

    <PcFooter
      :brand="brandConstants"
      :columns="footerColumns"
      :social="socialLinks"
      :bottom="footerBottom"
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
    linear-gradient(to right, rgba(20,21,15,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20,21,15,0.04) 1px, transparent 1px),
    linear-gradient(to right, rgba(20,21,15,0.018) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20,21,15,0.018) 1px, transparent 1px);
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
  font-size: 10px;
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
