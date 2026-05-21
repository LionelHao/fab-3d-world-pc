<script setup>
/**
 * Market — PC propagation (T3.7.1, Phase 3.7)
 * 密度 ≥80%. 业务零修改: getGoodsList / getCategories / searchGoods.
 */
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import PcNavbar from '@/components/PcNavbar.vue'
import PcTelemetryStrip from '@/components/PcTelemetryStrip.vue'
import PcSectionHeader from '@/components/PcSectionHeader.vue'
import PcFooter from '@/components/PcFooter.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiChip from '@/components/ui/UiChip.vue'

import {
  brandConstants,
  navLinks,
  telemetryDefaults,
} from '@/mocks/cd-3-fixture.js'
import { formatThousands } from '@/mocks/cd-4-fixture.js'

import { getGoodsList, getCategories, searchGoods } from '@/service/goods'

const router = useRouter()
const goods = ref([])
const categories = ref([])
const categoryId = ref(null)
const loading = ref(false)
const searchValue = ref('')

const telemetry = computed(() => ({
  ...telemetryDefaults,
  samples: { value: formatThousands(goods.value.length || 0) },
}))

const chipItems = computed(() => {
  const all = [{ id: null, label: 'All', ix: '01' }]
  categories.value.forEach((c, idx) => {
    all.push({ id: c.id, label: c.name, ix: String(idx + 2).padStart(2, '0') })
  })
  return all
})

function goDetail(id) {
  router.push(`/goods/${id}`)
}

async function loadGoods() {
  loading.value = true
  try {
    goods.value = (await getGoodsList(categoryId.value)) || []
  } finally {
    loading.value = false
  }
}

async function onSearch() {
  const v = (searchValue.value || '').trim()
  if (!v) {
    loadGoods()
    return
  }
  loading.value = true
  try {
    goods.value = (await searchGoods(v)) || []
  } catch {
    ElMessage.warning('搜索失败 · stand by')
  } finally {
    loading.value = false
  }
}

function onChipClick(c) {
  categoryId.value = c.id
  loadGoods()
}

onMounted(async () => {
  try {
    categories.value = (await getCategories()) || []
  } catch { /* axios interceptor handles */ }
  loadGoods()
})

function onNavClick(link) { if (link.route) router.push(link.route).catch(() => {}) }
function onLogo() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
function onBell() { ElMessage.info('Notifications (mock)') }
function onAvatar() { router.push('/profile').catch(() => {}) }
function onLocale() { ElMessage.info('Locale (mock)') }
function onUpload() { router.push('/publish').catch(() => ElMessage.info('Upload (mock)')) }
</script>

<template>
  <div class="market">
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

    <main class="market__main">
      <PcSectionHeader
        num="§ 01"
        title="Marketplace"
        :subtitle="`${goods.length} ENTRIES · LIVE INDEX`"
        cta-label="See all"
      />

      <div class="market__chips">
        <UiChip
          v-for="c in chipItems"
          :key="String(c.id)"
          :label="c.label"
          :active="categoryId === c.id"
          :index-label="c.ix"
          size="md"
          @click="onChipClick(c)"
        />
      </div>

      <div v-loading="loading" class="market__grid">
        <UiCard
          v-for="g in goods"
          :key="g.id"
          :sample-code="`FBW-${String(g.id || '0000').slice(-4).padStart(4, '0').toUpperCase()}-GDS`"
          :title="g.title"
          :cover-url="g.coverUrl"
          @click="goDetail(g.id)"
        />
        <div v-if="!loading && goods.length === 0" class="market__empty">
          EOF · NO GOODS · ADJUST FILTERS
        </div>
      </div>
    </main>

    <PcFooter />
  </div>
</template>

<style scoped>
.market {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

.market__main {
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 32px 48px;
}

.market__chips {
  display: flex;
  gap: 8px;
  margin: 16px 0 20px;
  flex-wrap: wrap;
}

.market__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1200px) {
  .market__grid { grid-template-columns: repeat(3, 1fr); }
}

.market__empty {
  grid-column: 1 / -1;
  padding: 48px 0;
  text-align: center;
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
