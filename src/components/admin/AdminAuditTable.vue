<script setup>
/**
 * AdminAuditTable — 登录审计表（user-auth P4）
 *
 * Spec: docs/user-auth-impl.md §2.2 + 01-architecture.md §11 P4 (`GET /admin/audit/login-events`)
 *
 * 过滤：userId / eventType / from / to / deviceType / failReason
 * 表列：time / userId / identifier / eventType / device / ip / ua / failReason
 * 关键事件高亮：ACCOUNT_LOCKED / PASSWORD_RESET / BAN
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElInput, ElSelect, ElOption, ElDatePicker, ElPagination, ElMessage,
} from 'element-plus'
import { listLoginEvents } from '@/service/admin'
import AdminCard from './AdminCard.vue'

const { t } = useI18n()

const PAGE_SIZE = 20
const CRIT_EVENTS = new Set(['ACCOUNT_LOCKED', 'PASSWORD_RESET', 'BAN'])

const filter = reactive({
  userId: '',
  type: '',
  from: null,
  to: null,
  deviceType: '',
  failReason: '',
})
const page = ref(1)
const total = ref(0)
const rows = ref([])
const loading = ref(false)

const TYPE_OPTIONS = computed(() => [
  { value: '', label: t('admin.users.filterAll') },
  { value: 'LOGIN_SUCCESS', label: t('admin.audit.eventType.LOGIN_SUCCESS') },
  { value: 'LOGIN_FAIL', label: t('admin.audit.eventType.LOGIN_FAIL') },
  { value: 'PASSWORD_RESET', label: t('admin.audit.eventType.PASSWORD_RESET') },
  { value: 'ACCOUNT_LOCKED', label: t('admin.audit.eventType.ACCOUNT_LOCKED') },
  { value: 'BAN', label: t('admin.audit.eventType.BAN') },
  { value: 'REFRESH', label: t('admin.audit.eventType.REFRESH') },
  { value: 'LOGOUT', label: t('admin.audit.eventType.LOGOUT') },
])
const DEVICE_OPTIONS = computed(() => [
  { value: '', label: t('admin.users.filterAll') },
  { value: 'pc', label: 'PC' },
  { value: 'web', label: 'WEB' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
])

function buildParams() {
  const params = { page: page.value, size: PAGE_SIZE }
  if (filter.userId !== '' && filter.userId != null) {
    const id = Number(filter.userId)
    if (Number.isFinite(id)) params.userId = id
  }
  if (filter.type) params.type = filter.type
  if (filter.from) params.from = new Date(filter.from).toISOString()
  if (filter.to) params.to = new Date(filter.to).toISOString()
  if (filter.deviceType) params.deviceType = filter.deviceType
  if (filter.failReason) params.failReason = filter.failReason.trim()
  return params
}

async function load() {
  loading.value = true
  try {
    const data = await listLoginEvents(buildParams())
    rows.value = data?.rows || []
    total.value = data?.total || 0
  } catch (e) {
    rows.value = []
    total.value = 0
    ElMessage.error(t('admin.toast.loadFailed'))
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onReset() {
  filter.userId = ''
  filter.type = ''
  filter.from = null
  filter.to = null
  filter.deviceType = ''
  filter.failReason = ''
  page.value = 1
  load()
}

function onPageChange(p) {
  page.value = p
  load()
}

function isCritEvent(eventType) {
  return CRIT_EVENTS.has(eventType)
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 19)
  } catch {
    return String(iso)
  }
}

function eventZh(eventType) {
  const key = `admin.audit.eventType.${eventType}`
  const translated = t(key)
  return translated === key ? eventType : translated
}

onMounted(load)
</script>

<template>
  <AdminCard num="§ E" :title="t('admin.audit.title')" stamp="AUDIT" stamp-tone="hilite">
    <div class="adm-audit__filter">
      <div data-test="adm-audit-user" class="adm-audit__field">
        <ElInput v-model="filter.userId" :placeholder="t('admin.audit.filter.userId')" clearable />
      </div>
      <ElSelect v-model="filter.type" :placeholder="t('admin.audit.filter.type')" clearable style="width: 140px">
        <ElOption v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
      </ElSelect>
      <ElDatePicker
        v-model="filter.from"
        type="datetime"
        :placeholder="t('admin.audit.filter.from')"
        style="width: 180px"
        data-test="adm-audit-from"
      />
      <ElDatePicker
        v-model="filter.to"
        type="datetime"
        :placeholder="t('admin.audit.filter.to')"
        style="width: 180px"
        data-test="adm-audit-to"
      />
      <ElSelect v-model="filter.deviceType" :placeholder="t('admin.audit.filter.device')" clearable style="width: 120px">
        <ElOption v-for="opt in DEVICE_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
      </ElSelect>
      <button type="button" class="adm-btn" data-test="adm-audit-search" @click="onSearch">
        {{ t('admin.audit.search') }}
      </button>
      <button type="button" class="adm-btn adm-btn--ghost" data-test="adm-audit-reset" @click="onReset">
        {{ t('admin.audit.reset') }}
      </button>
    </div>

    <table v-if="rows.length > 0" class="adm-audit__tbl">
      <thead>
        <tr>
          <th>{{ t('admin.audit.col.time') }}</th>
          <th>{{ t('admin.audit.col.userId') }}</th>
          <th>{{ t('admin.audit.col.identifier') }}</th>
          <th>{{ t('admin.audit.col.event') }}</th>
          <th>{{ t('admin.audit.col.device') }}</th>
          <th>{{ t('admin.audit.col.ip') }}</th>
          <th>{{ t('admin.audit.col.failReason') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ev, idx) in rows"
          :key="idx"
          :class="{ 'adm-audit__row--crit': isCritEvent(ev.eventType) }"
        >
          <td><code>{{ formatTime(ev.createdAt) }}</code></td>
          <td>{{ ev.userId ?? '—' }}</td>
          <td>{{ ev.identifier || '—' }}</td>
          <td>
            <code class="adm-audit__type">{{ ev.eventType }}</code>
            <span class="adm-audit__type-zh">{{ eventZh(ev.eventType) }}</span>
          </td>
          <td>{{ (ev.deviceType || '').toUpperCase() || '—' }}</td>
          <td>{{ ev.ip || '—' }}</td>
          <td>
            <span v-if="ev.failReason" class="adm-audit__fail">{{ ev.failReason }}</span>
            <template v-else>—</template>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="adm-audit__empty">{{ t('admin.audit.empty') }}</p>

    <ElPagination
      v-if="total > 0"
      v-model:current-page="page"
      :page-size="PAGE_SIZE"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="onPageChange"
      class="adm-audit__pagination"
    />
  </AdminCard>
</template>

<style scoped>
.adm-audit__filter {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-bottom: 1.5px solid var(--ink);
  flex-wrap: wrap;
}
.adm-audit__field { width: 120px; }
.adm-audit__tbl {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--f-mono);
  font-size: var(--text-11);
}
.adm-audit__tbl thead { background: var(--paper-2); }
.adm-audit__tbl th,
.adm-audit__tbl td {
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.adm-audit__tbl th {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: var(--text-10);
}
.adm-audit__row--crit { background: color-mix(in srgb, #b00020 8%, transparent); }
.adm-audit__type {
  background: var(--paper-2);
  padding: 1px 6px;
  margin-right: 6px;
  font-size: 9.5px;
  letter-spacing: 0.04em;
}
.adm-audit__type-zh { color: var(--ink-3); font-size: var(--text-10); }
.adm-audit__fail {
  color: var(--crit, #b00020);
  border: 1px solid currentColor;
  padding: 0 4px;
  font-size: 9.5px;
}
.adm-audit__empty {
  padding: 32px;
  text-align: center;
  font-family: var(--f-mono);
  color: var(--ink-3);
}
.adm-audit__pagination {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
}
.adm-btn {
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
}
.adm-btn--ghost { background: var(--paper); }
.adm-btn:hover { background: var(--hilite); }
.adm-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
