<script setup>
/**
 * PostDetail (PC) — PC propagation (T3.7.2, Phase 3.7)
 * 密度 ≥80%. 业务零修改: getPostDetail.
 */
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import PcNavbar from '@/components/PcNavbar.vue'
import PcTelemetryStrip from '@/components/PcTelemetryStrip.vue'
import PcFooter from '@/components/PcFooter.vue'
import PcDetailStick from '@/components/PcDetailStick.vue'
import PcCtaStack from '@/components/PcCtaStack.vue'
import UiSpecCard from '@/components/ui/UiSpecCard.vue'

import {
  brandConstants,
  navLinks,
  telemetryDefaults,
} from '@/mocks/cd-3-fixture.js'
import { formatThousands, formatSampleCode } from '@/mocks/cd-4-fixture.js'

import { getPostDetail } from '@/service/content'

const route = useRoute()
const router = useRouter()
const post = ref({})
const loading = ref(false)
const searchValue = ref('')

const tabs = [
  { id: 'overview', label: 'Overview', ix: '01' },
  { id: 'photos', label: 'Photos', ix: '02' },
  { id: 'discuss', label: 'Discuss', ix: '03' },
]
const activeTab = ref('overview')

const sampleCode = computed(() => formatSampleCode(post.value.id || route.params.id, 'POS'))

const telemetry = computed(() => ({
  ...telemetryDefaults,
  samples: { value: formatThousands(post.value.likeCount || 0) },
}))

const statsCells = computed(() => [
  { k: 'Likes', v: formatThousands(post.value.likeCount || 0) },
  { k: 'Saves', v: formatThousands(post.value.collectCount || 0) },
  { k: 'Photos', v: formatThousands((post.value.imageUrlList || []).length) },
  { k: 'Models', v: formatThousands((post.value.modelUrlList || []).length) },
  { k: 'Posted', v: post.value.createTime ? new Date(post.value.createTime).toLocaleDateString() : '—' },
  { k: 'ID', v: String(post.value.id || route.params.id || '—') },
])

const galleryImages = computed(() => post.value.imageUrlList || [])
const modelEntries = computed(() => post.value.modelUrlList || [])

onMounted(async () => {
  loading.value = true
  try {
    post.value = (await getPostDetail(route.params.id)) || {}
  } catch { /* axios interceptor handles */ } finally {
    loading.value = false
  }
})

function onLogo() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
function onNavClick(link) { if (link.route) router.push(link.route).catch(() => {}) }
function onBell() { ElMessage.info('Notifications (mock)') }
function onAvatar() { router.push('/profile').catch(() => {}) }
function onLocale() { ElMessage.info('Locale (mock)') }
function onUpload() { router.push('/publish').catch(() => ElMessage.info('Upload (mock)')) }
function onSearch() { ElMessage.info(`Search · "${searchValue.value}"`) }
function onPrimary() {
  ElMessage.info('Buy / Save action placeholder')
}
function onSecondary() {
  ElMessage.info('Share link copied (mock)')
}
function onModelClick(url) {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    window.open(url, '_blank', 'noopener')
    return
  }
  ElMessage.info('Model URL pending backend')
}
</script>

<template>
  <div class="pc-post-detail" v-loading="loading">
    <PcNavbar
      :nav-links="navLinks"
      :brand="brandConstants"
      v-model:search-value="searchValue"
      :bell-badge="true"
      @logo-click="onLogo"
      @nav-click="onNavClick"
      @search="onSearch"
      @locale-click="onLocale"
      @bell-click="onBell"
      @upload-click="onUpload"
      @avatar-click="onAvatar"
    />

    <PcTelemetryStrip :data="telemetry" />

    <div class="pc-post-detail__shell">
      <!-- LEFT: gallery -->
      <section class="pc-post-detail__gallery">
        <div class="pc-post-detail__gallery-head">
          <span>§ 01 · Gallery</span>
          <span class="pc-post-detail__gallery-stamp">{{ galleryImages.length }} ENTRIES</span>
        </div>
        <div v-if="galleryImages.length" class="pc-post-detail__gallery-grid">
          <img
            v-for="(url, i) in galleryImages"
            :key="i"
            :src="url"
            :alt="`Photo ${i + 1}`"
            class="pc-post-detail__photo"
          />
        </div>
        <div v-else class="pc-post-detail__gallery-empty">EOF · NO PHOTOS</div>
      </section>

      <!-- RIGHT: detail -->
      <aside class="pc-post-detail__right">
        <PcDetailStick
          :sample-code="sampleCode"
          class-badge="CLASS B"
          :certified="false"
          :model-name="post.title || 'UNTITLED'"
          :version-major="''"
          :version-minor="''"
          :author-name="post.userName || 'Operator'"
          :author-handle="post.userName || ''"
          :author-followers="''"
          :author-joined-year="''"
          :author-is-maker="false"
          :is-following="false"
          :tabs="tabs"
          :active-tab="activeTab"
          @tab-change="(id) => (activeTab = id)"
        />

        <div class="pc-post-detail__right-pad">
          <PcCtaStack
            primary-label="Buy / Save"
            primary-meta=""
            secondary-label="Share Link"
            secondary-aria-label="Share post link"
            @primary-click="onPrimary"
            @secondary-click="onSecondary"
          />

          <UiSpecCard
            num="§ 02"
            title="Stats"
            stamp="LIVE"
            :cells="statsCells"
            :cols="3"
          />

          <section class="pc-post-detail__notes">
            <div class="pc-post-detail__eyebrow">
              <span>§ 03 · Notes</span>
              <span class="pc-post-detail__eyebrow-stamp">CONTENT</span>
            </div>
            <p class="pc-post-detail__content">
              {{ post.content || 'NO CONTENT · STAND BY' }}
            </p>
          </section>

          <section v-if="modelEntries.length" class="pc-post-detail__models">
            <div class="pc-post-detail__eyebrow">
              <span>§ 04 · Model Files</span>
              <span class="pc-post-detail__eyebrow-stamp">{{ modelEntries.length }} ENTRIES</span>
            </div>
            <div class="pc-post-detail__models-list">
              <button
                v-for="(url, i) in modelEntries"
                :key="i"
                type="button"
                class="pc-post-detail__model-row"
                @click="onModelClick(url)"
              >
                <span class="pc-post-detail__model-ico">MDL</span>
                <span class="pc-post-detail__model-label">Model · {{ i + 1 }}</span>
                <span class="pc-post-detail__model-arrow">→</span>
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>

    <PcFooter />
  </div>
</template>

<style scoped>
.pc-post-detail {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

.pc-post-detail__shell {
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  padding: 16px 32px 32px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 16px;
  flex: 1 1 auto;
}

/* ===== Gallery (LEFT) ===== */
.pc-post-detail__gallery {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
}
.pc-post-detail__gallery-head {
  background: var(--ink);
  color: var(--paper);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-post-detail__gallery-stamp {
  color: var(--hilite);
  font-weight: 700;
}

.pc-post-detail__gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5px;
  background: var(--ink);
  padding: 0;
}
.pc-post-detail__photo {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--paper-2);
  display: block;
}

.pc-post-detail__gallery-empty {
  padding: 48px;
  text-align: center;
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ===== Right ===== */
.pc-post-detail__right {
  border: 1.5px solid var(--ink);
  background: var(--paper);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scrollbar-width: thin;
}
.pc-post-detail__right-pad {
  padding: 16px 20px 24px;
}

/* ===== Section eyebrow ===== */
.pc-post-detail__eyebrow {
  background: var(--ink);
  color: var(--paper);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-post-detail__eyebrow-stamp {
  color: var(--hilite);
  font-weight: 700;
}

.pc-post-detail__notes,
.pc-post-detail__models {
  border: 1.5px solid var(--ink);
  background: var(--paper);
  margin-bottom: 16px;
}

.pc-post-detail__content {
  margin: 0;
  padding: 14px;
  font-family: var(--f-sans);
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

.pc-post-detail__models-list {
  display: flex;
  flex-direction: column;
}
.pc-post-detail__model-row {
  display: grid;
  grid-template-columns: 56px 1fr 24px;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: var(--paper);
  border: 0;
  border-top: 1.5px solid var(--ink);
  cursor: pointer;
  text-align: left;
  transition: background-color 120ms ease-out;
}
.pc-post-detail__model-row:first-child {
  border-top: 0;
}
.pc-post-detail__model-row:hover {
  background: var(--paper-2);
}
.pc-post-detail__model-row:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.pc-post-detail__model-ico {
  width: 56px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ink);
  color: var(--hilite);
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.pc-post-detail__model-label {
  font-family: var(--f-cond);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
}
.pc-post-detail__model-arrow {
  font-family: var(--f-mono);
  font-size: 14px;
  color: var(--accent-link);
  text-align: center;
}
</style>
