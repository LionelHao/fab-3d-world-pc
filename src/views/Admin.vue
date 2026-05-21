<script setup>
/**
 * Admin.vue — PC 运营控制台（Ops Console）
 *
 * Phase 3.11 · anchor 1:1 复刻 cd-9-desktop-admin.html
 * Spec: docs/design/specs/p3.11-admin.md
 *
 * 装配: AdminNav + AdminTelemetry + shell(AdminSidebar + main(KPI strip /
 * ops-row(Stream + Alerts) / Tickets table)) + AdminFooter。
 *
 * 业务零修改: `admin.js` service 全部保留。getDashboard() 真实计数经 enrichAdmin()
 * 注入 sidebar section count；listUsers/listPosts/listOrders 由 sidebar §02.1/§03.1/§04.1
 * stab 触发真实读取。reports queue / stream / alerts 为运营 mock 域（见 fixture audit
 * §3 Mapping note 2），动作走 mock action（ElMessage + console.log）。
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboard, listPosts, listUsers, listOrders } from '@/service/admin'
import { enrichAdmin } from '@/mocks/cd-9-fixture'
import AdminNav from '@/components/admin/AdminNav.vue'
import AdminTelemetry from '@/components/admin/AdminTelemetry.vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminKpiCard from '@/components/admin/AdminKpiCard.vue'
import AdminCard from '@/components/admin/AdminCard.vue'
import AdminStream from '@/components/admin/AdminStream.vue'
import AdminAlert from '@/components/admin/AdminAlert.vue'
import AdminTicketsTable from '@/components/admin/AdminTicketsTable.vue'
import AdminFooter from '@/components/admin/AdminFooter.vue'

// view-model: 先用 fixture 兜底, getDashboard 成功后真实计数注入 sidebar
const vm = ref(enrichAdmin({}))
const activeTab = ref('01.1')

async function loadDashboard() {
  try {
    const dashboard = await getDashboard()
    vm.value = enrichAdmin(dashboard || {})
  } catch (error) {
    // backend 不可达 → 保留 fixture 兜底, 不降低视觉密度 (per CLAUDE.md Mock Fixture 原则)
    vm.value = enrichAdmin({})
  }
}

onMounted(loadDashboard)

/* ---- 派生印章文字 ---- */
const streamStamp = computed(() => 'AUTO-PAUSE · OFF')
const alertsStamp = computed(() => `${vm.value.alerts.length} OPEN`)
const ticketsStamp = computed(
  () => `${vm.value.tickets.meta.total} OPEN · ${vm.value.tickets.meta.crit} CRIT`,
)
const streamMetaText = computed(() => {
  const m = vm.value.stream.meta
  return `SHOWING ${m.showing} OF ${m.total} EVENTS · ${m.window} · TAIL FROM ${m.tailFrom}`
})
const ticketsMetaText = computed(() => {
  const m = vm.value.tickets.meta
  return `SHOWING ${m.showing} OF ${m.total} OPEN TICKETS · SORT ${m.sort}`
})

/* ---- sidebar 导航: §02.1/§03.1/§04.1 走真实 backend 读取 ---- */
const REAL_LOADERS = { '02.1': listUsers, '03.1': listPosts, '04.1': listOrders }

async function onSidebarTab({ section, tab }) {
  const loader = REAL_LOADERS[tab.ix]
  if (loader) {
    try {
      const data = await loader()
      console.log(`[admin] ${tab.label} loaded:`, data)
      ElMessage.success(`${tab.label} · ${Array.isArray(data) ? data.length : 0} 条`)
    } catch (error) {
      ElMessage.info(`${tab.label} · 切换`)
    }
    return
  }
  console.log('[admin] sidebar tab:', tab.ix, tab.label)
  ElMessage.info(`${section.name} · ${tab.label}`)
}

/* ---- mock action handlers (运营 mock 域) ---- */
function onLogo() {
  console.log('[admin] logo')
  ElMessage.info('Ops Console')
}
function onHelp() {
  console.log('[admin] help')
  ElMessage.info('Help · ⌘K command palette')
}
function onBell() {
  console.log('[admin] notifications')
  ElMessage.info(`${vm.value.alerts.length} alerts open`)
}
function onAvatar() {
  console.log('[admin] account')
  ElMessage.info(vm.value.ctx.operator)
}
function onAlertAction(alert, act) {
  console.log('[admin] alert action:', alert.title, act.label)
  ElMessage.success(`${act.label} · ${alert.title}`)
}
function onCreateAlert() {
  console.log('[admin] create manual alert')
  ElMessage.info('Create manual alert')
}
function onTicketAction({ ticket, action }) {
  console.log('[admin] ticket action:', ticket.id, action.label)
  ElMessage.success(`${ticket.id} · ${action.label}`)
}
function onLoadOlder() {
  console.log('[admin] load older events')
  ElMessage.info('Load older events')
}
function onViewAllTickets() {
  console.log('[admin] view all tickets')
  ElMessage.info(`View all ${vm.value.tickets.meta.total} tickets`)
}
</script>

<template>
  <div class="admin-outer">
    <div class="admin-page">
      <AdminNav
        :brand="vm.brand"
        :ctx="vm.ctx"
        @logo-click="onLogo"
        @help-click="onHelp"
        @bell-click="onBell"
        @avatar-click="onAvatar"
      />

      <AdminTelemetry :items="vm.telemetry.items" :live="vm.telemetry.live" />

      <div class="admin-shell">
        <AdminSidebar
          v-model:active="activeTab"
          :sections="vm.sidebar.sections"
          :foot="vm.sidebar.foot"
          @tab-click="onSidebarTab"
        />

        <main class="admin-main">
          <!-- KPI strip -->
          <section class="admin-kpi-strip">
            <AdminKpiCard v-for="kpi in vm.kpi" :key="kpi.ix" v-bind="kpi" />
          </section>

          <!-- ops row: stream + alerts -->
          <section class="admin-ops-row">
            <AdminCard num="§ S" title="Stream · Live Tail" led :stamp="streamStamp" stamp-tone="hilite">
              <AdminStream :rows="vm.stream.rows" />
              <template #foot>
                <span class="admin-meta">{{ streamMetaText }}</span>
                <button type="button" class="admin-obtn" @click="onLoadOlder">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  Load older
                </button>
              </template>
            </AdminCard>

            <AdminCard num="§ A" title="Alerts" :stamp="alertsStamp" stamp-tone="crit">
              <div class="admin-alert-list">
                <AdminAlert
                  v-for="(alert, idx) in vm.alerts"
                  :key="idx"
                  :sev="alert.sev"
                  :tone="alert.tone"
                  :age="alert.age"
                  :title="alert.title"
                  :since="alert.since"
                  :actions="alert.actions"
                  @action="onAlertAction(alert, $event)"
                />
                <button type="button" class="admin-add" @click="onCreateAlert">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  Create manual alert
                </button>
              </div>
            </AdminCard>
          </section>

          <!-- tickets table -->
          <AdminCard num="§ T" title="Tickets · Reports Queue" :stamp="ticketsStamp" stamp-tone="crit">
            <AdminTicketsTable :rows="vm.tickets.rows" @action="onTicketAction" />
            <template #foot>
              <span class="admin-meta">{{ ticketsMetaText }}</span>
              <button type="button" class="admin-obtn" @click="onViewAllTickets">
                View all {{ vm.tickets.meta.total }} →
              </button>
            </template>
          </AdminCard>
        </main>
      </div>

      <AdminFooter
        :version="vm.footer.version"
        :sessions="vm.footer.sessions"
        :network="vm.footer.network"
        :shortcuts="vm.footer.shortcuts"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-outer {
  min-height: 100vh;
  background: var(--ink);
  display: flex;
  justify-content: center;
}
.admin-page {
  width: 1440px;
  min-width: 1440px;
  background: var(--paper);
  position: relative;
  display: flex;
  flex-direction: column;
  /* CAD 网格背景 (cd-9 .page) */
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to right, color-mix(in srgb, var(--ink) 2%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 2%, transparent) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
}

.admin-shell {
  display: grid;
  grid-template-columns: 200px 1fr;
  flex: 1;
  min-height: calc(100vh - 56px - 30px - 28px);
}

.admin-main {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

/* KPI strip */
.admin-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* ops row */
.admin-ops-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
}

/* alerts list */
.admin-alert-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.admin-add {
  background: var(--paper);
  border: 1.5px dashed var(--ink);
  height: 36px;
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.admin-add svg {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}
.admin-add:hover { background: var(--hilite); }
.admin-add:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

/* card-foot 内部元素 */
.admin-meta {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.admin-obtn {
  height: 28px;
  padding: 0 10px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.admin-obtn svg {
  width: 11px;
  height: 11px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.admin-obtn:hover { background: var(--hilite); }
.admin-obtn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
