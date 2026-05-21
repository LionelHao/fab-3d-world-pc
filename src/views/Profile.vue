<script setup>
/**
 * Profile — PC Operator Dashboard（Phase 3.10, T3.10.5）
 *
 * Anchor: docs/design/inspiration/cd-8-desktop-profile.html（1:1 复刻）
 * Spec:   docs/design/specs/p3.10-profile.md
 *
 * 装配: PcNavbar + PcTelemetryStrip(items) + page-header + 2-col layout
 *       (PcProfileSidebar + content 4×PcSubSection) + PcFooter.
 * 业务零修改: getUserInfo / logout 真接; settings/stats/log/achievements mock.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import PcNavbar from '@/components/PcNavbar.vue'
import PcTelemetryStrip from '@/components/PcTelemetryStrip.vue'
import PcFooter from '@/components/PcFooter.vue'
import PcProfileSidebar from '@/components/profile/PcProfileSidebar.vue'
import PcSubSection from '@/components/profile/PcSubSection.vue'
import PcActivityLog from '@/components/profile/PcActivityLog.vue'
import PcAchievementCard from '@/components/profile/PcAchievementCard.vue'

import { getUserInfo, logout } from '@/service/user'
import { useUserStore } from '@/stores/user'
import {
  brandConstants,
  navLinks,
  searchDefaults,
  localePack,
  footerColumns,
  socialLinks,
  footerBottom,
} from '@/mocks/cd-3-fixture.js'
import { enrichProfilePc } from '@/mocks/cd-8-fixture.js'

const router = useRouter()
const userStore = useUserStore()

/* ── view-model ── */
const vm = ref(enrichProfilePc({}))
const searchValue = ref('')
const activeSideTab = ref(0)

/* ── §01.1 Identity 可编辑字段（local，无后端持久化）── */
const displayName = ref(vm.value.displayName)
const bio = ref(vm.value.bio)
const bioCount = computed(() => bio.value.length)

/* ── data load ── */
async function load() {
  try {
    const userInfo = (await getUserInfo()) || null
    if (userInfo) {
      vm.value = enrichProfilePc(userInfo)
      displayName.value = vm.value.displayName
      bio.value = vm.value.bio
    }
  } catch {
    ElMessage.warning('个人资料加载失败，使用占位数据')
  }
}

/* ── mock action handlers（settings/stats 无后端 → mock 反馈）── */
function onNavClick(link) { ElMessage.info(`Nav · ${link.label} (mock)`) }
function onSearch(v) { ElMessage.info(`Search · ${v || '—'} (mock)`) }
function onLocaleClick() { ElMessage.info('Locale (mock)') }
function onBellClick() { ElMessage.info('Notifications (mock)') }
function onUploadClick() { ElMessage.info('Log Sample (mock)') }
function onAvatarClick() { ElMessage.info('Account (mock)') }
function onLogoClick() { router.push('/home') }
function onSideTab(tab) {
  console.log('[Profile] side tab', tab.label) // TODO: backend integration
  ElMessage.info(`${tab.label} (mock)`)
}
function onExportData() { ElMessage.success('Export queued (mock)') }
function onPublicProfile() { ElMessage.info('Public profile (mock)') }
function onHandleChange() { ElMessage.info('Change handle (mock)') }
function onReplaceImage() { ElMessage.info('Replace image (mock)') }
function onAddTag() { ElMessage.info('Add tag (mock)') }
function onViewLog() { ElMessage.info('Full activity log (mock)') }
function onViewAchievements() { ElMessage.info('All achievements (mock)') }
function onFooterLink(link) { ElMessage.info(`${link.label ?? link} (mock)`) }
function onFooterSocial(s) { ElMessage.info(`${s.id ?? s} (mock)`) }
function onFooterLogo() { router.push('/home') }
async function onSignOut() {
  try {
    await logout()
  } catch {
    // 后端登出失败不阻断本地清理
  }
  userStore.logout()
  ElMessage.success('Signed out')
  router.push('/login')
}

onMounted(load)
</script>

<template>
  <div class="pc-profile">
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

    <PcTelemetryStrip :items="vm.telemetry.items" />

    <!-- ===== page header ===== -->
    <div class="pc-profile__header">
      <h1 class="pc-profile__h1">
        Operator <span class="pc-profile__h1-sep">·</span>
        <span class="pc-profile__h1-handle">{{ vm.handle }}</span>
      </h1>
      <div class="pc-profile__actions">
        <button type="button" class="pc-profile__pbtn" @click="onExportData">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" /></svg>
          Export Data
        </button>
        <button type="button" class="pc-profile__pbtn" @click="onPublicProfile">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
          Public Profile
        </button>
        <button type="button" class="pc-profile__pbtn pc-profile__pbtn--warn" @click="onSignOut">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h12" /></svg>
          Sign Out
        </button>
      </div>
    </div>

    <!-- ===== 2-col layout ===== -->
    <div class="pc-profile__layout">
      <PcProfileSidebar
        v-model:active-index="activeSideTab"
        :avatar-text="vm.avatarText"
        :avatar-src="vm.avatarSrc"
        :handle="vm.handle"
        :dossier="vm.sidebar.dossier"
        :tabs="vm.sidebar.tabs"
        :foot="vm.sidebar.foot"
        @tab-click="onSideTab"
      />

      <main class="pc-profile__content">
        <!-- ===== § 01.1 Identity ===== -->
        <PcSubSection num="§ 01.1" name="Display · Public" stamp="EDIT MODE">
          <div class="pc-profile__id-grid">
            <div class="pc-profile__id-fields">
              <div class="pc-profile__field">
                <div class="pc-profile__field-lbl">
                  <span>Handle</span>
                  <a href="#" class="pc-profile__change" @click.prevent="onHandleChange">Change ›</a>
                </div>
                <div class="pc-profile__input-wrap pc-profile__input-wrap--ro">
                  <input type="text" :value="vm.handle" readonly aria-label="Handle" />
                  <span class="pc-profile__badge">READONLY</span>
                </div>
              </div>
              <div class="pc-profile__field">
                <div class="pc-profile__field-lbl"><span>Display Name</span></div>
                <div class="pc-profile__input-wrap">
                  <input v-model="displayName" type="text" aria-label="Display Name" />
                </div>
              </div>
              <div class="pc-profile__field">
                <div class="pc-profile__field-lbl">
                  <span>Bio</span>
                  <span class="pc-profile__count">{{ bioCount }} / {{ vm.identity.bioMax }} chars</span>
                </div>
                <textarea
                  v-model="bio"
                  class="pc-profile__textarea"
                  :maxlength="vm.identity.bioMax"
                  aria-label="Bio"
                />
              </div>
              <div class="pc-profile__field">
                <div class="pc-profile__field-lbl"><span>Tags</span></div>
                <div class="pc-profile__tags">
                  <span
                    v-for="(tag, idx) in vm.identity.tags"
                    :key="tag"
                    class="pc-profile__tag"
                    :class="{ 'pc-profile__tag--active': idx === 0 }"
                  >{{ tag }}</span>
                  <button type="button" class="pc-profile__tag pc-profile__tag--add" @click="onAddTag">+ ADD</button>
                </div>
              </div>
            </div>

            <!-- av-card -->
            <div class="pc-profile__av-card">
              <div class="pc-profile__av-head">
                <span>AVATAR</span><span class="pc-profile__av-id">200×200</span>
              </div>
              <div class="pc-profile__av-preview-wrap">
                <span class="pc-profile__av-c pc-profile__av-c--tl" />
                <span class="pc-profile__av-c pc-profile__av-c--tr" />
                <span class="pc-profile__av-c pc-profile__av-c--bl" />
                <span class="pc-profile__av-c pc-profile__av-c--br" />
                <div class="pc-profile__av-preview">
                  <img v-if="vm.avatarSrc" :src="vm.avatarSrc" :alt="vm.handle" />
                  <span v-else>{{ vm.avatarText }}</span>
                </div>
              </div>
              <button type="button" class="pc-profile__av-replace" @click="onReplaceImage">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" /></svg>
                Replace Image
              </button>
              <div class="pc-profile__av-meta">
                <div v-for="m in vm.identity.avatarMeta" :key="m.k" class="pc-profile__av-meta-r">
                  <span>{{ m.k }}</span><b>{{ m.v }}</b>
                </div>
              </div>
            </div>
          </div>
        </PcSubSection>

        <!-- ===== § 01.2 Studio Stats ===== -->
        <PcSubSection num="§ 01.2" name="Studio Stats" stamp="8 METRICS · LAST 30 D" stamp-tone="dim">
          <div class="pc-profile__stats">
            <div v-for="(cell, idx) in vm.stats" :key="idx" class="pc-profile__stat-cell">
              <span class="pc-profile__stat-k">{{ cell.k }}</span>
              <span class="pc-profile__stat-v">
                <span v-if="cell.vEm" class="pc-profile__stat-em">{{ cell.v }}</span>
                <template v-else>{{ cell.v }}</template>
                <small v-if="cell.vUnit"> {{ cell.vUnit }}</small>
              </span>
              <span
                class="pc-profile__stat-delta"
                :class="`pc-profile__stat-delta--${cell.deltaTone}`"
              >{{ cell.delta }}</span>
            </div>
          </div>
        </PcSubSection>

        <!-- ===== § 01.3 Activity log ===== -->
        <PcSubSection num="§ 01.3" name="Activity · Last 30 Days" stamp="6 ENTRIES · TAIL" stamp-tone="dim">
          <PcActivityLog
            :rows="vm.activity.rows"
            :meta="vm.activity.meta"
            @view-log="onViewLog"
          />
        </PcSubSection>

        <!-- ===== § 01.4 Achievements ===== -->
        <PcSubSection num="§ 01.4" name="Achievements" :stamp="`${vm.achievements.meta.shown} OF ${vm.achievements.meta.total} SHOWN`">
          <div class="pc-profile__ach-grid">
            <PcAchievementCard
              v-for="a in vm.achievements.items"
              :key="a.ix"
              :ix="a.ix"
              :badge="a.badge"
              :title="a.title"
              :meta="a.meta"
            />
          </div>
          <div class="pc-profile__ach-foot">
            <a href="#" @click.prevent="onViewAchievements">View all achievements ({{ vm.achievements.meta.total }}) →</a>
          </div>
        </PcSubSection>
      </main>
    </div>

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
.pc-profile {
  min-width: 1440px;
  background: var(--paper);
}

/* ===== page header ===== */
.pc-profile__header {
  width: 1280px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1.5px solid var(--ink);
}
.pc-profile__h1 {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 32px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.015em;
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.pc-profile__h1-sep { color: var(--ink-3); font-weight: 500; }
.pc-profile__h1-handle { color: var(--accent-link); }
.pc-profile__actions { display: flex; gap: 8px; }
.pc-profile__pbtn {
  height: 36px;
  padding: 0 14px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pc-profile__pbtn:hover { background: var(--paper-3); }
.pc-profile__pbtn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-profile__pbtn--warn { border-color: var(--semantic-warning); color: var(--semantic-warning); }

/* ===== 2-col layout ===== */
.pc-profile__layout {
  width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 24px 0;
}
.pc-profile__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

/* ===== § 01.1 Identity ===== */
.pc-profile__id-grid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 24px;
  padding: 20px;
}
.pc-profile__id-fields { display: flex; flex-direction: column; gap: 16px; }
.pc-profile__field { display: flex; flex-direction: column; gap: 6px; }
.pc-profile__field-lbl {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pc-profile__change {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--accent-link);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}
.pc-profile__count {
  color: var(--ink-3);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.04em;
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}
.pc-profile__input-wrap {
  height: 40px;
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  display: flex;
  align-items: stretch;
}
.pc-profile__input-wrap:focus-within { box-shadow: var(--glow-accent-ring); }
.pc-profile__input-wrap input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: 13px;
  font-weight: 500;
  padding: 0 12px;
  font-variant-numeric: tabular-nums;
}
.pc-profile__input-wrap--ro input { color: var(--ink-2); }
.pc-profile__badge {
  font-family: var(--f-mono);
  font-size: 9px;
  background: var(--ink);
  color: var(--paper);
  padding: 0 8px;
  display: flex;
  align-items: center;
  letter-spacing: 0.08em;
  font-weight: 700;
  border-left: 1.5px solid var(--ink);
}
.pc-profile__textarea {
  min-height: 96px;
  background: var(--paper-2);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: 13px;
  font-weight: 500;
  padding: 10px 12px;
  resize: vertical;
  outline: 0;
  line-height: 1.5;
}
.pc-profile__textarea:focus-visible { box-shadow: var(--glow-accent-ring); }
.pc-profile__tags { display: flex; gap: 6px; flex-wrap: wrap; }
.pc-profile__tag {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 600;
  border: 1.5px solid var(--ink);
  color: var(--ink);
  background: transparent;
  padding: 3px 8px;
  letter-spacing: 0.06em;
}
.pc-profile__tag--active {
  background: var(--ink);
  color: var(--hilite);
  padding: 4px 8px;
}
.pc-profile__tag--add {
  border-style: dashed;
  border-color: var(--ink-2);
  color: var(--ink-2);
  cursor: pointer;
}
.pc-profile__tag--add:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

/* av-card */
.pc-profile__av-card {
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  display: flex;
  flex-direction: column;
}
.pc-profile__av-head {
  background: var(--ink);
  color: var(--paper);
  padding: 5px 8px;
  font-family: var(--f-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pc-profile__av-id { color: var(--hilite); font-weight: 600; }
.pc-profile__av-preview-wrap { position: relative; }
.pc-profile__av-c {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--accent-link);
  z-index: 2;
}
.pc-profile__av-c--tl { top: 4px; left: 4px; border-right: 0; border-bottom: 0; }
.pc-profile__av-c--tr { top: 4px; right: 4px; border-left: 0; border-bottom: 0; }
.pc-profile__av-c--bl { bottom: 4px; left: 4px; border-right: 0; border-top: 0; }
.pc-profile__av-c--br { bottom: 4px; right: 4px; border-left: 0; border-top: 0; }
.pc-profile__av-preview {
  width: 100%;
  aspect-ratio: 1;
  background: var(--hilite);
  border-bottom: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-cond);
  font-size: 86px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.03em;
  position: relative;
}
.pc-profile__av-preview::after {
  content: "";
  position: absolute;
  inset: 8px;
  border: 1px dashed color-mix(in srgb, var(--ink) 25%, transparent);
  pointer-events: none;
}
.pc-profile__av-preview img { width: 100%; height: 100%; object-fit: cover; }
.pc-profile__av-replace {
  margin: 10px;
  height: 32px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.pc-profile__av-replace:hover { background: var(--paper-3); }
.pc-profile__av-replace:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-profile__av-meta {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--ink-2);
  margin: 0 10px 10px;
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.pc-profile__av-meta-r {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dashed color-mix(in srgb, var(--ink) 18%, transparent);
}
.pc-profile__av-meta-r:last-child { border-bottom: 0; }
.pc-profile__av-meta-r b { color: var(--ink); font-weight: 600; }

/* ===== § 01.2 Stats ===== */
.pc-profile__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5px;
  background: var(--ink);
  border-top: 1.5px solid var(--ink);
}
.pc-profile__stat-cell {
  background: var(--paper);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pc-profile__stat-k {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}
.pc-profile__stat-v {
  font-family: var(--f-mono);
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
  line-height: 1.05;
}
.pc-profile__stat-v small { color: var(--ink-3); font-size: 13px; font-weight: 500; }
.pc-profile__stat-em { color: var(--ink); background: var(--hilite); padding: 0 4px; }
.pc-profile__stat-delta {
  font-family: var(--f-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
}
.pc-profile__stat-delta--accent { color: var(--accent-link); }
.pc-profile__stat-delta--warn { color: var(--semantic-warning); }
.pc-profile__stat-delta--dim { color: var(--ink-3); font-weight: 500; }

/* ===== § 01.4 Achievements ===== */
.pc-profile__ach-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
}
.pc-profile__ach-foot {
  padding: 12px 20px 16px;
  text-align: right;
  border-top: 1.5px solid var(--ink);
  background: var(--paper-2);
}
.pc-profile__ach-foot a {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1.5px solid var(--ink);
  padding-bottom: 1px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
