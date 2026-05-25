<script setup>
/**
 * AdminUserMgmt — 用户管理（user-auth P4，auth 字段为主）
 *
 * Spec: docs/user-auth-impl.md §2.1 + 01-architecture.md §11 P4
 *
 * 字段：username / phoneMasked / emailMasked / status / roles / lastLoginAt + 操作
 * （脱敏由后端做，前端只渲染）
 *
 * 操作列：
 *   - 详情：调 getUserDetail + 弹 AdminUserDetailDrawer
 *   - 角色编辑：仅 super_admin v-if，弹 AdminRoleEditDialog
 *   - 封禁 / 解封：弹 AdminBanDialog（带 reason+untilAt）或 ElMessageBox.confirm
 *   - 强制下线：ElMessageBox.confirm
 *
 * **不显示** nickname/avatar/bio/tier 等 user-info 字段。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElTable, ElTableColumn, ElInput, ElSelect, ElOption, ElPagination, ElMessage, ElMessageBox,
} from 'element-plus'
import {
  listUsers, getUserDetail, banUser, unbanUser, setUserRoles, revokeAllSessions,
} from '@/service/admin'
import { useUserStore } from '@/stores/user'
import AdminCard from './AdminCard.vue'
import AdminBanDialog from './AdminBanDialog.vue'
import AdminRoleEditDialog from './AdminRoleEditDialog.vue'
import AdminUserDetailDrawer from './AdminUserDetailDrawer.vue'

const { t } = useI18n()
const userStore = useUserStore()

const PAGE_SIZE = 20

const filter = reactive({
  keyword: '',
  status: '',
  role: '',
})
const page = ref(1)
const total = ref(0)
const rows = ref([])
const loading = ref(false)

// 子组件 v-model
const banDialogOpen = ref(false)
const rolesDialogOpen = ref(false)
const detailDialogOpen = ref(false)
const detailLoading = ref(false)
const activeUser = ref(null)
const detailUser = ref(null)

const STATUS_OPTIONS = computed(() => [
  { value: '', label: t('admin.users.filterAll') },
  { value: 'NORMAL', label: t('admin.users.statusNormal') },
  { value: 'BANNED', label: t('admin.users.statusBanned') },
  { value: 'SUSPENDED', label: t('admin.users.statusSuspended') },
])
const ROLE_OPTIONS = computed(() => [
  { value: '', label: t('admin.users.filterAll') },
  { value: 'user', label: t('admin.roles.user') },
  { value: 'creator', label: t('admin.roles.creator') },
  { value: 'moderator', label: t('admin.roles.moderator') },
  { value: 'admin', label: t('admin.roles.admin') },
  { value: 'super_admin', label: t('admin.roles.super_admin') },
])

const isSuperAdmin = computed(() => userStore.hasRole('super_admin'))

function buildParams() {
  const params = { page: page.value, size: PAGE_SIZE }
  if (filter.keyword.trim()) params.keyword = filter.keyword.trim()
  if (filter.status) params.status = filter.status
  if (filter.role) params.role = filter.role
  return params
}

async function load() {
  loading.value = true
  try {
    const data = await listUsers(buildParams())
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

function onPageChange(p) {
  page.value = p
  load()
}

function statusLabel(status) {
  const key = `admin.users.status${status?.charAt(0)}${status?.slice(1).toLowerCase()}`
  const translated = t(key)
  return translated === key ? status : translated
}

function statusClass(status) {
  return `adm-status adm-status--${(status || '').toLowerCase()}`
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 16)
  } catch {
    return String(iso)
  }
}

/* ---------- 操作 ---------- */

async function onDetail(row) {
  activeUser.value = row
  detailDialogOpen.value = true
  detailLoading.value = true
  try {
    detailUser.value = await getUserDetail(row.userId)
  } catch (e) {
    ElMessage.error(t('admin.toast.loadFailed'))
    detailUser.value = row
  } finally {
    detailLoading.value = false
  }
}

function onEditRoles(row) {
  activeUser.value = row
  rolesDialogOpen.value = true
}

async function onRolesSubmit(body) {
  if (!activeUser.value) return
  try {
    await setUserRoles(activeUser.value.userId, body)
    ElMessage.success(t('admin.toast.rolesUpdated'))
    await load()
  } catch (e) {
    ElMessage.error(t('admin.toast.loadFailed'))
  }
}

function onBan(row) {
  activeUser.value = row
  banDialogOpen.value = true
}

async function onBanSubmit(body) {
  if (!activeUser.value) return
  try {
    await banUser(activeUser.value.userId, body)
    ElMessage.success(t('admin.toast.banSuccess'))
    await load()
  } catch (e) {
    ElMessage.error(t('admin.toast.loadFailed'))
  }
}

async function onUnban(row) {
  try {
    await ElMessageBox.confirm(
      t('admin.users.confirmUnban', { name: row.username || row.userId }),
      t('admin.users.unban'),
      { confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') },
    )
  } catch {
    return // cancel
  }
  try {
    await unbanUser(row.userId)
    ElMessage.success(t('admin.toast.unbanSuccess'))
    await load()
  } catch (e) {
    ElMessage.error(t('admin.toast.loadFailed'))
  }
}

async function onRevokeAll(row) {
  try {
    await ElMessageBox.confirm(
      t('admin.users.confirmRevokeAll', { name: row.username || row.userId }),
      t('admin.users.revokeAll'),
      { confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel'), type: 'warning' },
    )
  } catch {
    return
  }
  try {
    const res = await revokeAllSessions(row.userId)
    ElMessage.success(t('admin.toast.sessionsRevoked', { count: res?.revokedCount ?? 0 }))
  } catch (e) {
    ElMessage.error(t('admin.toast.loadFailed'))
  }
}

onMounted(load)
</script>

<template>
  <AdminCard num="§ U" :title="t('admin.users.title')" stamp="AUTH" stamp-tone="hilite">
    <div class="adm-users__filter">
      <div data-test="adm-users-search" class="adm-users__search">
        <ElInput
          v-model="filter.keyword"
          :placeholder="t('admin.users.search')"
          clearable
          @keyup.enter="onSearch"
        />
      </div>
      <ElSelect v-model="filter.status" :placeholder="t('admin.users.filterStatus')" clearable style="width: 140px">
        <ElOption v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
      </ElSelect>
      <ElSelect v-model="filter.role" :placeholder="t('admin.users.filterRole')" clearable style="width: 140px">
        <ElOption v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
      </ElSelect>
      <button type="button" class="adm-btn" data-test="adm-users-search-btn" @click="onSearch">
        {{ t('admin.audit.search') }}
      </button>
    </div>

    <table v-if="rows.length > 0" class="adm-users__tbl">
      <thead>
        <tr>
          <th>{{ t('admin.users.col.username') }}</th>
          <th>{{ t('admin.users.col.phone') }}</th>
          <th>{{ t('admin.users.col.email') }}</th>
          <th>{{ t('admin.users.col.status') }}</th>
          <th>{{ t('admin.users.col.roles') }}</th>
          <th>{{ t('admin.users.col.lastLogin') }}</th>
          <th>{{ t('admin.users.col.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.userId">
          <td>{{ row.username }}</td>
          <td>{{ row.phoneMasked || '—' }}</td>
          <td>{{ row.emailMasked || '—' }}</td>
          <td>
            <span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
          </td>
          <td>
            <code v-for="r in (row.roles || [])" :key="r" class="adm-role-chip">{{ r }}</code>
          </td>
          <td>{{ formatTime(row.lastLoginAt) }}</td>
          <td class="adm-users__actions">
            <button
              type="button"
              class="adm-btn adm-btn--sm"
              :data-test="`adm-users-detail-${row.userId}`"
              @click="onDetail(row)"
            >{{ t('admin.users.detail') }}</button>
            <button
              v-if="isSuperAdmin"
              type="button"
              class="adm-btn adm-btn--sm"
              :data-test="`adm-users-roles-${row.userId}`"
              @click="onEditRoles(row)"
            >{{ t('admin.users.editRoles') }}</button>
            <button
              v-if="row.status === 'NORMAL'"
              type="button"
              class="adm-btn adm-btn--sm adm-btn--crit"
              :data-test="`adm-users-ban-${row.userId}`"
              @click="onBan(row)"
            >{{ t('admin.users.ban') }}</button>
            <button
              v-else
              type="button"
              class="adm-btn adm-btn--sm"
              :data-test="`adm-users-unban-${row.userId}`"
              @click="onUnban(row)"
            >{{ t('admin.users.unban') }}</button>
            <button
              type="button"
              class="adm-btn adm-btn--sm"
              :data-test="`adm-users-revoke-${row.userId}`"
              @click="onRevokeAll(row)"
            >{{ t('admin.users.revokeAll') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="adm-users__empty">{{ t('admin.users.empty') }}</p>

    <ElPagination
      v-if="total > 0"
      v-model:current-page="page"
      :page-size="PAGE_SIZE"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="onPageChange"
      class="adm-users__pagination"
    />

    <!-- 子 dialogs -->
    <AdminBanDialog
      v-model:open="banDialogOpen"
      :user="activeUser"
      @submit="onBanSubmit"
    />
    <AdminRoleEditDialog
      v-if="isSuperAdmin"
      v-model:open="rolesDialogOpen"
      :user="activeUser"
      :current-user-id="userStore.userId"
      @submit="onRolesSubmit"
    />
    <AdminUserDetailDrawer
      v-model:open="detailDialogOpen"
      :user="detailUser"
      :loading="detailLoading"
    />
  </AdminCard>
</template>

<style scoped>
.adm-users__filter {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-bottom: 1.5px solid var(--ink);
}
.adm-users__search { flex: 1; }
.adm-users__tbl {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--f-mono);
  font-size: var(--text-11);
}
.adm-users__tbl thead {
  background: var(--paper-2);
}
.adm-users__tbl th,
.adm-users__tbl td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.adm-users__tbl th {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: var(--text-10);
  color: var(--ink);
}
.adm-users__actions { display: flex; gap: 4px; flex-wrap: wrap; }
.adm-users__empty {
  padding: 32px;
  text-align: center;
  font-family: var(--f-mono);
  color: var(--ink-3);
}
.adm-users__pagination {
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
.adm-btn--sm { height: 24px; padding: 0 8px; font-size: 9.5px; }
.adm-btn--crit { background: var(--ink); color: var(--paper); }
.adm-btn:hover { background: var(--hilite); }
.adm-btn--crit:hover { background: var(--crit, #b00020); }
.adm-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.adm-status {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  padding: 2px 8px;
  border: 1.5px solid var(--ink);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.adm-status--normal { color: var(--ink); }
.adm-status--banned {
  background: var(--ink);
  color: var(--paper);
}
.adm-status--suspended { color: var(--warn, #b58900); border-color: currentColor; }
.adm-role-chip {
  display: inline-block;
  background: var(--paper-2);
  padding: 1px 6px;
  margin-right: 4px;
  font-family: var(--f-mono);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
