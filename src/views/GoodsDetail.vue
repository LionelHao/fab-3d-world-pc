<script setup>
/**
 * GoodsDetail (PC) — Studio · Specimen Sheet (T3.4.4, Phase 3.4 anchor)
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md
 * Anchor: docs/design/inspiration/cd-4-desktop.html (cd-4 Studio workspace)
 *
 * 装配:
 *  - 顶部 studio NAV (内联, 自定 wordmark + app-mode + ctx + Help/Bell/Avatar)
 *  - studio Telemetry (内联, 自定 POLY/DIM/MASS/FRAMES/GPU)
 *  - studio shell (2-col grid: PcViewerStage 左 + .detail 右)
 *    - PcViewerStage 含 slot: breadcrumb / scale-bar / controls / toggle / variants / axis / 默认 render
 *    - .detail 含: PcDetailStick (sticky) + PcCtaStack + UiSpecCard × 2 (§ 01 Geometry + § 02 Print Config) + § 03 Files (PcFileRow × 5) + tip widget + § 04 Related (PcRelatedCard × 3)
 *  - PcFooter 复用
 *
 * 业务零修改: getGoodsDetail(route.params.id) 保留 + enrichWithGoodsFixture 兜底.
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as OV from 'online-3d-viewer/build/engine/o3dv.module.js'
import { attachViewerSoul } from '@/utils/viewerSoul.js'

import PcViewerStage from '@/components/PcViewerStage.vue'
import PcDetailStick from '@/components/PcDetailStick.vue'
import PcCtaStack from '@/components/PcCtaStack.vue'
import PcFileRow from '@/components/PcFileRow.vue'
import PcRelatedCard from '@/components/PcRelatedCard.vue'
import PcFooter from '@/components/PcFooter.vue'
import UiSpecCard from '@/components/ui/UiSpecCard.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'
import UiIconButton from '@/components/ui/UiIconButton.vue'

import {
  studioBrandConstants,
  studioTelemetryDefaults,
  viewerOverlayDefaults,
  tabsDefaults,
  tipDefaults,
  enrichWithGoodsFixture,
  formatFileSize,
  formatThousands,
} from '@/mocks/cd-4-fixture.js'
// PC footer 是跨页公用 chrome，数据来自 cd-3-fixture
import {
  brandConstants as pcBrand,
  footerColumns,
  socialLinks,
  footerBottom,
} from '@/mocks/cd-3-fixture.js'

import { getGoodsDetail } from '@/service/goods'

const route = useRoute()
const router = useRouter()

const goods = ref(null)
const loading = ref(false)

/* ─── 3D viewer (Phase 4 T4.1: online-3d-viewer + viewerSoul) ─── */
const viewerStageRef = ref(null)
const viewerReady = ref(false)
let viewer = null
let soul = null // viewerSoul 控制器（轨道入场 + 自转）

function initViewer() {
  const container = viewerStageRef.value?.canvasRef
  if (!container || viewer) return
  try {
    viewer = new OV.EmbeddedViewer(container, {
      onModelLoaded: () => {
        viewerReady.value = true
        // 模型加载完成后注入相机轨道入场动画 + 空闲自转
        if (soul) soul.restart()
        else soul = attachViewerSoul(viewer, { autoSpin: autoRotate.value })
      },
    })
    const url = enriched.value.modelUrl // fixture 兜底必非空
    if (url) viewer.LoadModelFromUrlList([url])
  } catch (err) {
    console.error('[GoodsDetail] viewer 初始化失败:', err)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    goods.value = (await getGoodsDetail(route.params.id)) || null
  } catch {
    // axios interceptor 已处理; fixture 接管兜底
  } finally {
    loading.value = false
  }
  // 数据就绪后初始化 3D viewer（modelUrl 经 fixture 兜底必非空）
  await nextTick()
  initViewer()
})

onUnmounted(() => {
  soul?.dispose()
  soul = null
  if (viewer) {
    try {
      viewer.Destroy?.()
    } catch {
      // noop
    }
    viewer = null
  }
})

const enriched = computed(() => enrichWithGoodsFixture(goods.value))

/* ─── 交互状态 ─── */
const activeTab = ref('overview')
const activeNavCtrl = ref({})
const autoRotate = ref(viewerOverlayDefaults.autoRotate.enabled)
const activeVariant = ref('v3.4')
const isFollowing = ref(false)
const activeTipAmount = ref(5)

/* ─── 派生 ─── */
const ctxItems = computed(() => [
  { label: 'SESSION', value: studioBrandConstants.ctxDefaults.session },
  { label: 'VIEW', value: studioBrandConstants.ctxDefaults.view },
  { label: 'ZOOM', value: studioBrandConstants.ctxDefaults.zoom },
])
const savedState = studioBrandConstants.ctxDefaults.savedState
const sampleCodePill = computed(() => enriched.value.sampleCode || 'FBW-0000')

const telemetryItems = computed(() => {
  const m = enriched.value
  return [
    { label: 'POLY', value: formatThousands(m.polygons) },
    { label: 'DIM', value: m.dimText },
    { label: 'MASS', value: m.massText },
    { label: 'FRAMES', value: studioTelemetryDefaults.frames },
    { label: 'GPU', value: studioTelemetryDefaults.gpu },
  ]
})

const ctrlGroups = computed(() => viewerOverlayDefaults.controls.groups)
const breadcrumb = viewerOverlayDefaults.breadcrumb
const axisLabels = viewerOverlayDefaults.axisLabels

const geometryCells = computed(() => {
  const m = enriched.value
  return [
    { k: 'Dimensions', v: m.dimensions ? `${m.dimensions.w}×${m.dimensions.d}×${m.dimensions.h}` : '—', vSmall: 'mm' },
    { k: 'Polygons', v: formatThousands(m.polygons) },
    { k: 'Vertices', v: formatThousands(m.vertices_count) },
    { k: 'Volume', v: m.volume_cm3 != null ? String(m.volume_cm3) : '—', vSmall: 'cm³' },
    { k: 'Surface', v: m.surface_cm2 != null ? String(m.surface_cm2) : '—', vSmall: 'cm²' },
    { k: 'Mass est.', v: m.mass_g != null ? `~${m.mass_g}` : '—', vSmall: 'g' },
  ]
})
const printConfigCells = computed(() => {
  const m = enriched.value
  return [
    { k: 'Layer', v: m.recommended_layer_mm != null ? String(m.recommended_layer_mm.toFixed(2)) : '—', vSmall: 'mm' },
    { k: 'Infill', v: m.infill_pct != null ? String(m.infill_pct) : '—', vSmall: m.infill_pattern ? `% ${m.infill_pattern}` : '%' },
    { k: 'Material', v: (m.compatible_materials || []).join(' / ') || '—' },
    { k: 'Supports', v: m.needs_supports === false ? 'None' : m.needs_supports ? 'Required' : '—', vEm: m.needs_supports === false },
    { k: 'Nozzle', v: m.nozzle_mm != null ? String(m.nozzle_mm.toFixed(2)) : '—', vSmall: 'mm' },
    { k: 'Print Time', v: m.print_time_str || '—' },
  ]
})

const geometryStamp = computed(() => {
  const sc = enriched.value.sampleCode || ''
  const m = sc.match(/-(\d{4})-/)
  const four = m ? m[1] : 'XXXX'
  return `FBW-${four} · A`
})
const filesStamp = computed(() => {
  const f = enriched.value.files || []
  return `${f.length} ENTRIES · BUNDLE ${enriched.value.fileSizeStr}`
})

const authorFollowersText = computed(() => {
  const n = enriched.value.user?.followers_count
  return n != null ? formatThousands(n) : ''
})

/* ─── handlers (mock action 全部 ElMessage + console.log) ─── */
function onLogo() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function onHelp() {
  ElMessage.info('Help center (mock)')
}
function onBell() {
  ElMessage.info('Notifications (mock)')
}
function onAvatar() {
  router.push('/profile').catch(() => ElMessage.info('Profile route (mock)'))
}
function onCtrlClick(groupTitle, item) {
  activeNavCtrl.value[groupTitle] = item.id
  ElMessage.info(`Ctrl · ${groupTitle} → ${item.label} (${item.kbd})`)
}
function isCtrlActive(groupTitle, item) {
  const v = activeNavCtrl.value[groupTitle]
  if (v != null) return v === item.id
  return !!item.active
}
function onToggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  // Phase 4 T4.1: 接 viewerSoul — 真实暂停 / 恢复模型自转
  if (autoRotate.value) soul?.resume()
  else soul?.pause()
  ElMessage.success(`Auto-rotate ${autoRotate.value ? 'ON' : 'OFF'}`)
}
function onVariantClick(v) {
  activeVariant.value = v.id
  ElMessage.info(`Variant · ${v.label}`)
}
function onTabChange(tabId) {
  activeTab.value = tabId
}
function onFollow() {
  isFollowing.value = !isFollowing.value
  ElMessage.success(isFollowing.value ? '已关注' : '已取消关注')
}
function onAuthorClick() {
  ElMessage.info(`@${enriched.value.user?.handle || 'maker'} 主页 (mock)`)
}
function onDownloadBundle() {
  const url = enriched.value.modelUrl
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    window.open(url, '_blank', 'noopener')
    return
  }
  ElMessage.info('Bundle 下载链接待后端就位')
}
function onSendToPrint() {
  ElMessage.info('Print queue 待接入')
}
function onFileDownload(file) {
  if (file.url) {
    window.open(file.url, '_blank', 'noopener')
    return
  }
  ElMessage.info(`Download · ${file.filename} (mock)`)
}
function onTip(opt) {
  activeTipAmount.value = opt.amount
  ElMessage.success(`Tip $${opt.amount} 已选 (mock 支付待接入)`)
}
function onBreadcrumb(crumb) {
  if (crumb.href) router.push(crumb.href).catch(() => ElMessage.info(`Breadcrumb · ${crumb.label}`))
}
function onRelatedClick(item) {
  router.push(`/goods/${item.id}`).catch(() => ElMessage.info(`Open · ${item.title}`))
}
function onRelatedViewAll() {
  router.push('/market').catch(() => ElMessage.info('All related (mock)'))
}
</script>

<template>
  <div class="goods-detail">
    <!-- ===== STUDIO NAV (内联 cd-4 自定 layout) ===== -->
    <nav class="goods-detail__nav">
      <div class="goods-detail__nav-inner">
        <div class="goods-detail__nav-left">
          <a class="goods-detail__wm" href="#" @click.prevent="onLogo">
            {{ studioBrandConstants.wordmark.left }}
            <span class="goods-detail__wm-div">{{ studioBrandConstants.wordmark.divider }}</span>
            {{ studioBrandConstants.wordmark.right }}
            <span class="goods-detail__wm-tag">{{ studioBrandConstants.wordmark.tag }}</span>
          </a>
          <span class="goods-detail__app-mode">{{ studioBrandConstants.appMode }}</span>
        </div>
        <div class="goods-detail__ctx">
          <span class="goods-detail__pill">{{ sampleCodePill }}</span>
          <template v-for="(item, idx) in ctxItems" :key="item.label">
            <span v-if="idx > 0" class="goods-detail__ctx-sep">/</span>
            <span>{{ item.label }} <b>{{ item.value }}</b></span>
          </template>
          <span class="goods-detail__ctx-sep">/</span>
          <span class="goods-detail__ctx-saved">{{ savedState }}</span>
        </div>
        <div class="goods-detail__nav-right">
          <button class="goods-detail__icon-sq" type="button" aria-label="Help" @click="onHelp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 .8-2 1.3-2 2.5" />
              <circle cx="12" cy="17" r="0.8" fill="currentColor" />
            </svg>
          </button>
          <UiIconButton variant="outline" :size="32" :badge="true" aria-label="Notifications" @click="onBell">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
          </UiIconButton>
          <button class="goods-detail__nav-avatar" type="button" aria-label="My profile" @click="onAvatar">
            <UiAvatar :initials="studioBrandConstants.currentUserInitials" :size="32" palette="hilite" shape="square" />
          </button>
        </div>
      </div>
    </nav>

    <!-- ===== Telemetry strip ===== -->
    <div class="goods-detail__telemetry">
      <span class="goods-detail__telemetry-led" aria-hidden="true" />
      <span>STUDIO LIVE</span>
      <template v-for="(item, idx) in telemetryItems" :key="item.label">
        <span class="goods-detail__telemetry-sep">/</span>
        <span>{{ item.label }} <b>{{ item.value }}</b></span>
      </template>
    </div>

    <!-- ===== Studio shell ===== -->
    <div class="goods-detail__studio">
      <!-- LEFT viewer -->
      <PcViewerStage ref="viewerStageRef" class="goods-detail__viewer">
        <template #breadcrumb>
          <div class="goods-detail__breadcrumb">
            <template v-for="(c, idx) in breadcrumb" :key="c.label">
              <span v-if="idx > 0" class="goods-detail__breadcrumb-sep">›</span>
              <a
                v-if="!c.current"
                :href="c.href || '#'"
                class="goods-detail__breadcrumb-link"
                @click.prevent="onBreadcrumb(c)"
              >{{ c.label }}</a>
              <span v-else class="goods-detail__breadcrumb-here">{{ c.label }}</span>
            </template>
          </div>
        </template>

        <template #scale-bar>
          <div class="goods-detail__scale-bar" aria-hidden="true">
            <span class="goods-detail__scale-tick goods-detail__scale-tick--long" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick goods-detail__scale-tick--long" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick" />
            <span class="goods-detail__scale-tick goods-detail__scale-tick--long" />
            <span class="goods-detail__scale-label">{{ viewerOverlayDefaults.scaleRulerLabel }}</span>
          </div>
        </template>

        <template #controls>
          <div class="goods-detail__controls" aria-label="Viewer controls">
            <div class="goods-detail__controls-head">
              <span>CONTROLS</span>
              <span class="goods-detail__controls-id">{{ viewerOverlayDefaults.controls.panelId }}</span>
            </div>
            <div v-for="group in ctrlGroups" :key="group.title" class="goods-detail__ctrl-group">
              <div class="goods-detail__ctrl-gh">
                <span>{{ group.title }}</span>
                <span class="goods-detail__ctrl-ix">{{ group.ix }}</span>
              </div>
              <div class="goods-detail__ctrl-row">
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  type="button"
                  class="goods-detail__ctrl-btn"
                  :class="{ 'goods-detail__ctrl-btn--active': isCtrlActive(group.title, item) }"
                  :aria-label="`${group.title} ${item.label} (${item.kbd})`"
                  @click="onCtrlClick(group.title, item)"
                >
                  <span class="goods-detail__ctrl-kbd">{{ item.kbd }}</span>
                  <span class="goods-detail__ctrl-lbl">{{ item.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <template #toggle>
          <button
            type="button"
            class="goods-detail__rotate"
            :class="{ 'goods-detail__rotate--on': autoRotate }"
            @click="onToggleAutoRotate"
          >
            <span class="goods-detail__rotate-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9" />
                <path d="M3 6V3h3" />
              </svg>
            </span>
            <span>Auto-rotate</span>
            <span class="goods-detail__rotate-sw" />
            <span class="goods-detail__rotate-state">{{ autoRotate ? 'ON' : 'OFF' }}</span>
          </button>
        </template>

        <template #variants>
          <div class="goods-detail__variants">
            <div class="goods-detail__variants-head">
              <span>Variants</span>
              <span>
                <b>{{ String(enriched.variants.length).padStart(2, '0') }}</b> / {{ String(enriched.variants.length).padStart(2, '0') }}
              </span>
            </div>
            <div class="goods-detail__variants-strip">
              <button
                v-for="v in enriched.variants"
                :key="v.id"
                type="button"
                class="goods-detail__vthumb"
                :class="{ 'goods-detail__vthumb--active': activeVariant === v.id }"
                :aria-label="`Variant ${v.label}`"
                @click="onVariantClick(v)"
              >
                <span class="goods-detail__vthumb-art" aria-hidden="true">●</span>
                <span class="goods-detail__vthumb-label">{{ v.label }}</span>
              </button>
            </div>
          </div>
        </template>

        <template #axis>
          <div class="goods-detail__axis" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="36" height="36">
              <line x1="18" y1="18" x2="32" y2="22" stroke="var(--semantic-warning)" stroke-width="1.4" stroke-linecap="round" />
              <text x="33" y="24" font-family="IBM Plex Mono" font-size="6" font-weight="700" fill="var(--semantic-warning)">{{ axisLabels.x }}</text>
              <line x1="18" y1="18" x2="14" y2="32" stroke="var(--accent-link)" stroke-width="1.4" stroke-linecap="round" />
              <text x="11" y="35" font-family="IBM Plex Mono" font-size="6" font-weight="700" fill="var(--accent-link)">{{ axisLabels.y }}</text>
              <line x1="18" y1="18" x2="18" y2="4" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" />
              <text x="20" y="5" font-family="IBM Plex Mono" font-size="6" font-weight="700" fill="var(--ink)">{{ axisLabels.z }}</text>
              <circle cx="18" cy="18" r="1.5" fill="var(--ink)" />
            </svg>
            <span class="goods-detail__axis-label">{{ axisLabels.world }}</span>
          </div>
        </template>

        <!-- 默认 render slot: viewer 未就位时显示占位 (Phase 4 T4.1) -->
        <div v-if="!viewerReady" class="goods-detail__render-placeholder" aria-hidden="true">
          <span>3D RENDER</span>
          <span class="sub">SLOT · awaiting viewer attach</span>
        </div>
      </PcViewerStage>

      <!-- RIGHT detail -->
      <div class="goods-detail__right">
        <PcDetailStick
          :sample-code="enriched.sampleCode"
          class-badge="CLASS A"
          :certified="!!enriched.certified"
          :model-name="enriched.title"
          :version-major="enriched.version_major ?? ''"
          :version-minor="enriched.version_minor ?? ''"
          :author-name="enriched.user?.username || ''"
          :author-handle="enriched.user?.handle || enriched.user?.username || ''"
          :author-followers="authorFollowersText"
          :author-joined-year="enriched.user?.joined_year ?? ''"
          :author-is-maker="!!enriched.user?.is_maker"
          :is-following="isFollowing"
          :tabs="tabsDefaults"
          :active-tab="activeTab"
          @follow-toggle="onFollow"
          @tab-change="onTabChange"
          @author-click="onAuthorClick"
        />

        <div class="goods-detail__right-pad">
          <PcCtaStack
            primary-label="Download Bundle"
            :primary-meta="enriched.fileSizeStr"
            secondary-label="Send to Print Queue"
            secondary-aria-label="Send to Print Queue"
            @primary-click="onDownloadBundle"
            @secondary-click="onSendToPrint"
          />

          <UiSpecCard
            num="§ 01"
            title="Geometry"
            :stamp="geometryStamp"
            :cells="geometryCells"
            :cols="3"
          />

          <UiSpecCard
            num="§ 02"
            title="Print Config"
            stamp="RECOMMENDED · FDM"
            :cells="printConfigCells"
            :cols="3"
          />

          <!-- § 03 Files -->
          <section class="goods-detail__section">
            <div class="goods-detail__eyebrow">
              <span class="goods-detail__brow-text">
                <span class="goods-detail__brow-num">§ 03</span>
                <span class="goods-detail__brow-title">· Files</span>
              </span>
              <span class="goods-detail__brow-stamp">{{ filesStamp }}</span>
            </div>
            <div class="goods-detail__files">
              <PcFileRow
                v-for="(file, idx) in enriched.files"
                :key="file.filename"
                :format="file.format"
                :filename="file.filename"
                :description="file.description"
                :size="formatFileSize(file.size_bytes)"
                :primary="idx === 0"
                @download="onFileDownload(file)"
              />
            </div>
          </section>

          <!-- Tip widget -->
          <div class="goods-detail__tip">
            <div class="goods-detail__tip-icon">{{ tipDefaults.prefix }}</div>
            <div class="goods-detail__tip-text">
              <span class="goods-detail__tip-title">{{ tipDefaults.title.replace('{handle}', enriched.user?.handle || 'maker') }}</span>
              <span class="goods-detail__tip-subtitle">
                {{ tipDefaults.subtitle.replace('{months}', String(enriched.iteration_months ?? 8)) }}
              </span>
            </div>
            <div class="goods-detail__tip-options">
              <button
                v-for="opt in tipDefaults.options"
                :key="opt.amount"
                type="button"
                class="goods-detail__tip-opt"
                :class="{ 'goods-detail__tip-opt--active': activeTipAmount === opt.amount }"
                @click="onTip(opt)"
              >
                ${{ opt.amount }}
              </button>
            </div>
          </div>

          <!-- § 04 Related -->
          <section class="goods-detail__related">
            <div class="goods-detail__related-head">
              <span class="goods-detail__related-title">§ 04 · Related Specimens</span>
              <a class="goods-detail__related-view-all" href="#" @click.prevent="onRelatedViewAll">View all →</a>
            </div>
            <div class="goods-detail__related-grid">
              <PcRelatedCard
                v-for="r in enriched.related"
                :key="r.id"
                :sample-id="r.sample_id"
                :title="r.title"
                :likes="formatThousands(r.likes) + (r.likes >= 1000 ? '' : '')"
                :price="r.price"
                @click="onRelatedClick(r)"
              >
                <!-- 派生占位 svg (生产时 backend 应返回 thumb_url) -->
                <svg viewBox="0 0 80 80" preserveAspectRatio="xMidYMid meet">
                  <rect x="14" y="20" width="52" height="40" fill="none" stroke="var(--ink)" stroke-width="1.2" />
                  <line x1="14" y1="40" x2="66" y2="40" stroke="var(--ink-3)" stroke-width="0.8" stroke-dasharray="2 2" />
                  <circle cx="40" cy="40" r="6" fill="var(--hilite)" stroke="var(--ink)" stroke-width="1" />
                  <text x="40" y="74" font-family="IBM Plex Mono" font-size="6" font-weight="700" fill="var(--ink-3)" text-anchor="middle" letter-spacing="0.08em">SPECIMEN</text>
                </svg>
              </PcRelatedCard>
            </div>
          </section>
        </div>
      </div>
    </div>

    <PcFooter
      :brand="pcBrand"
      :columns="footerColumns"
      :social="socialLinks"
      :bottom="footerBottom"
    />
  </div>
</template>

<style scoped>
.goods-detail {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

/* ===== Studio NAV ===== */
.goods-detail__nav {
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
  position: sticky;
  top: 0;
  z-index: 10;
}
.goods-detail__nav-inner {
  max-width: 1440px;
  margin: 0 auto;
  height: 56px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.goods-detail__nav-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-shrink: 0;
}
.goods-detail__wm {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.goods-detail__wm-div {
  color: var(--ink-3);
  font-weight: 500;
}
.goods-detail__wm-tag {
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink);
  background: var(--hilite);
  padding: 2px 6px;
  text-transform: uppercase;
  transform: translateY(-2px);
}
.goods-detail__app-mode {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.goods-detail__ctx {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
}
.goods-detail__ctx b {
  color: var(--ink);
  font-weight: 700;
}
.goods-detail__ctx-sep {
  color: var(--ink-3);
}
.goods-detail__pill {
  border: 1.5px solid var(--ink);
  padding: 3px 8px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.06em;
}
.goods-detail__ctx-saved {
  color: var(--accent-link);
  font-weight: 600;
}

.goods-detail__nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.goods-detail__icon-sq {
  width: 36px;
  height: 36px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 120ms ease-out;
}
.goods-detail__icon-sq:hover {
  background: var(--paper-3);
}
.goods-detail__icon-sq:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.goods-detail__icon-sq svg {
  width: 18px;
  height: 18px;
}

.goods-detail__nav-avatar {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  border-radius: var(--radius-none);
}
.goods-detail__nav-avatar:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

/* ===== Telemetry ===== */
.goods-detail__telemetry {
  background: var(--ink);
  color: var(--paper);
  font-family: var(--f-mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 7px 32px;
  display: flex;
  align-items: center;
  gap: 14px;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--ink);
  overflow: hidden;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.goods-detail__telemetry-led {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: 0 0 8px var(--hilite);
  flex-shrink: 0;
  animation: goods-detail-pulse 1.6s ease-in-out infinite;
}
@keyframes goods-detail-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.goods-detail__telemetry b {
  color: var(--hilite);
  font-weight: 700;
}
.goods-detail__telemetry-sep {
  color: var(--ink-3);
}

/* ===== Studio shell ===== */
.goods-detail__studio {
  width: 100%; /* flex column 父级中 margin:0 auto 会禁用 stretch，须显式撑满 (Phase 4 T4.1 修既有塌缩) */
  max-width: 1440px;
  margin: 0 auto;
  padding: 16px 32px 32px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 16px;
  flex: 1 1 auto;
}

.goods-detail__viewer {
  height: 720px;
}

.goods-detail__right {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  max-height: 720px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.goods-detail__right-pad {
  padding: 16px 20px 24px;
}

/* ===== Breadcrumb (viewer overlay) ===== */
.goods-detail__breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  position: relative;
}
.goods-detail__breadcrumb::before,
.goods-detail__breadcrumb::after {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  border: 1.5px solid var(--accent-link);
  pointer-events: none;
}
.goods-detail__breadcrumb::before {
  top: -3px;
  left: -3px;
  border-right: 0;
  border-bottom: 0;
}
.goods-detail__breadcrumb::after {
  bottom: -3px;
  right: -3px;
  border-left: 0;
  border-top: 0;
}
.goods-detail__breadcrumb-link {
  color: var(--ink-2);
  text-decoration: none;
}
.goods-detail__breadcrumb-link:hover {
  color: var(--ink);
}
.goods-detail__breadcrumb-sep {
  color: var(--ink-3);
}
.goods-detail__breadcrumb-here {
  color: var(--ink);
  font-weight: 700;
}

/* ===== Scale bar ===== */
.goods-detail__scale-bar {
  display: flex;
  align-items: flex-end;
  gap: 0;
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
}
.goods-detail__scale-tick {
  width: 1px;
  height: 5px;
  background: var(--ink-2);
  margin-right: 10px;
}
.goods-detail__scale-tick--long {
  height: 10px;
}
.goods-detail__scale-label {
  margin-left: 8px;
  text-transform: uppercase;
}

/* ===== Controls panel (viewer overlay top-right) ===== */
.goods-detail__controls {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  width: 220px;
}
.goods-detail__controls-head {
  background: var(--ink);
  color: var(--paper);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.goods-detail__controls-id {
  color: var(--hilite);
}
.goods-detail__ctrl-group {
  border-top: 1px solid var(--ink-2);
}
.goods-detail__ctrl-group:first-of-type {
  border-top: 0;
}
.goods-detail__ctrl-gh {
  padding: 6px 10px 4px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-2);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.goods-detail__ctrl-ix {
  color: var(--accent-link);
}
.goods-detail__ctrl-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--ink-2);
  padding: 0 1px 1px;
}
.goods-detail__ctrl-btn {
  background: var(--paper);
  border: 0;
  border-radius: var(--radius-none);
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}
.goods-detail__ctrl-btn:hover {
  background: var(--paper-3);
}
.goods-detail__ctrl-btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1.5px var(--hilite);
}
.goods-detail__ctrl-btn--active {
  background: var(--ink);
  color: var(--paper);
}
.goods-detail__ctrl-btn--active:hover {
  background: var(--accent-link);
}
.goods-detail__ctrl-kbd {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--hilite);
  border: 1px solid var(--ink-2);
  padding: 1px 5px;
  letter-spacing: 0.04em;
}
.goods-detail__ctrl-btn:not(.goods-detail__ctrl-btn--active) .goods-detail__ctrl-kbd {
  color: var(--accent-link);
  background: var(--paper-3);
}
.goods-detail__ctrl-lbl {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ===== Auto-rotate toggle ===== */
.goods-detail__rotate {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 12px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}
.goods-detail__rotate:hover {
  background: var(--paper-3);
}
.goods-detail__rotate:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.goods-detail__rotate-icon {
  width: 14px;
  height: 14px;
  color: var(--accent-link);
}
.goods-detail__rotate-icon svg {
  width: 14px;
  height: 14px;
}
.goods-detail__rotate-sw {
  width: 18px;
  height: 8px;
  background: var(--ink-3);
  position: relative;
  transition: background-color 120ms ease-out;
}
.goods-detail__rotate-sw::after {
  content: "";
  position: absolute;
  top: -2px;
  left: 0;
  width: 8px;
  height: 12px;
  background: var(--ink);
  transition: left 120ms ease-out;
}
.goods-detail__rotate--on .goods-detail__rotate-sw {
  background: var(--hilite);
}
.goods-detail__rotate--on .goods-detail__rotate-sw::after {
  left: 10px;
}
.goods-detail__rotate-state {
  font-weight: 700;
  color: var(--ink);
}

/* ===== Variants ===== */
.goods-detail__variants {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 8px 10px;
  width: 280px;
}
.goods-detail__variants-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--ink-2);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.goods-detail__variants-head b {
  color: var(--ink);
  font-weight: 700;
}
.goods-detail__variants-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.goods-detail__vthumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  cursor: pointer;
  transition: background-color 120ms ease-out, transform 120ms ease-out;
}
.goods-detail__vthumb:hover {
  background: var(--paper-3);
}
.goods-detail__vthumb:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.goods-detail__vthumb--active {
  background: var(--hilite);
  border-color: var(--ink);
}
.goods-detail__vthumb-art {
  font-family: var(--f-mono);
  font-size: 18px;
  color: var(--ink);
}
.goods-detail__vthumb-label {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ===== Axis indicator ===== */
.goods-detail__axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.goods-detail__axis-label {
  font-family: var(--f-mono);
  font-size: 8px;
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* ===== Render placeholder ===== */
.goods-detail__render-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.goods-detail__render-placeholder .sub {
  font-size: 9px;
  color: var(--ink-3);
}

/* ===== Section eyebrow (§ 03 + § 04) ===== */
.goods-detail__section {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  margin-bottom: 16px;
}
.goods-detail__eyebrow {
  background: var(--ink);
  color: var(--paper);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.goods-detail__brow-text {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.goods-detail__brow-num {
  color: var(--hilite);
  font-weight: 700;
}
.goods-detail__brow-title {
  color: var(--paper);
  font-weight: 500;
}
.goods-detail__brow-stamp {
  color: var(--ink-3);
  font-size: 10px;
  font-weight: 600;
}

.goods-detail__files {
  display: flex;
  flex-direction: column;
}

/* ===== Tip widget ===== */
.goods-detail__tip {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: var(--paper-2);
  border: 1.5px solid var(--ink);
  margin-bottom: 16px;
}
.goods-detail__tip-icon {
  width: 32px;
  height: 32px;
  background: var(--hilite);
  color: var(--ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-cond);
  font-size: 18px;
  font-weight: 700;
  border: 1.5px solid var(--ink);
}
.goods-detail__tip-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.goods-detail__tip-title {
  font-family: var(--f-cond);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
}
.goods-detail__tip-subtitle {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.goods-detail__tip-options {
  display: flex;
  gap: 4px;
}
.goods-detail__tip-opt {
  height: 30px;
  padding: 0 10px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}
.goods-detail__tip-opt:hover {
  background: var(--paper-3);
}
.goods-detail__tip-opt:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.goods-detail__tip-opt--active {
  background: var(--ink);
  color: var(--hilite);
}

/* ===== Related ===== */
.goods-detail__related {
  margin-top: 8px;
}
.goods-detail__related-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1.5px solid var(--ink);
  margin-bottom: 10px;
}
.goods-detail__related-title {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.goods-detail__related-view-all {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--accent-link);
  text-decoration: none;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.goods-detail__related-view-all:hover {
  color: var(--ink);
}
.goods-detail__related-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
</style>
