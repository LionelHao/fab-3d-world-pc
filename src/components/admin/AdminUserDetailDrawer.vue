<script setup>
/**
 * AdminUserDetailDrawer — 用户详情抽屉（user-auth P4）
 *
 * Spec: docs/user-auth-impl.md §2.1 + 01-architecture.md §11 P4 (`GET /admin/users/{id}`)
 *
 * 显示：userId / createTime / lastLogin / activeSessions + 最近 N 条 login events。
 * 关键事件高亮：ACCOUNT_LOCKED / PASSWORD_RESET / BAN。
 * **不显示** nickname/avatar/bio 等 user-info 字段（归 user-info 模块）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog } from 'element-plus'

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  user: { type: Object, default: () => null },
})
const emit = defineEmits(['update:open'])

const { t } = useI18n()

const title = computed(() =>
  t('admin.users.detailDialog.title', { name: props.user?.username || props.user?.userId || '' }),
)

const CRIT_EVENTS = new Set(['ACCOUNT_LOCKED', 'PASSWORD_RESET', 'BAN'])

function isCritEvent(eventType) {
  return CRIT_EVENTS.has(eventType)
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 16)
  } catch {
    return String(iso)
  }
}

function eventLabel(eventType) {
  // 翻译键存在则取；否则回退 raw code
  const key = `admin.audit.eventType.${eventType}`
  const translated = t(key)
  return translated === key ? eventType : translated
}

function onClose() {
  emit('update:open', false)
}
</script>

<template>
  <ElDialog
    :model-value="open"
    :title="title"
    width="640px"
    append-to-body
    @update:model-value="(v) => emit('update:open', v)"
  >
    <div v-if="loading" class="adm-detail__loading">{{ t('common.actions.loading') }}</div>
    <template v-else-if="user">
      <section class="adm-detail__block">
        <h4 class="adm-detail__hd">{{ t('admin.users.detailDialog.basic') }}</h4>
        <dl class="adm-detail__kv">
          <div><dt>{{ t('admin.users.detailDialog.userId') }}</dt><dd>{{ user.userId }}</dd></div>
          <div><dt>{{ t('admin.users.detailDialog.createTime') }}</dt><dd>{{ formatTime(user.createTime) }}</dd></div>
          <div><dt>{{ t('admin.users.detailDialog.lastLogin') }}</dt><dd>{{ formatTime(user.lastLogin) }}</dd></div>
          <div><dt>{{ t('admin.users.detailDialog.activeSessions') }}</dt><dd>{{ user.activeSessions ?? 0 }}</dd></div>
        </dl>
      </section>

      <section class="adm-detail__block">
        <h4 class="adm-detail__hd">{{ t('admin.users.detailDialog.events') }}</h4>
        <p v-if="!user.events || user.events.length === 0" class="adm-detail__empty">
          {{ t('admin.users.detailDialog.noEvents') }}
        </p>
        <ul v-else class="adm-detail__events">
          <li
            v-for="(ev, idx) in user.events"
            :key="idx"
            class="adm-detail__event"
            :class="{ 'adm-detail__event--crit': isCritEvent(ev.eventType) }"
          >
            <code class="adm-detail__event-time">{{ formatTime(ev.createdAt) }}</code>
            <code class="adm-detail__event-type">{{ ev.eventType }}</code>
            <span class="adm-detail__event-typezh">{{ eventLabel(ev.eventType) }}</span>
            <span class="adm-detail__event-ip">{{ ev.ip || '—' }}</span>
            <span class="adm-detail__event-dev">{{ (ev.deviceType || '').toUpperCase() }}</span>
            <span v-if="ev.failReason" class="adm-detail__event-fail">{{ ev.failReason }}</span>
          </li>
        </ul>
      </section>
    </template>

    <template #footer>
      <button type="button" class="adm-btn" data-test="adm-detail-close" @click="onClose">
        {{ t('common.actions.cancel') }}
      </button>
    </template>
  </ElDialog>
</template>

<style scoped>
.adm-detail__loading,
.adm-detail__empty {
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-3);
  text-align: center;
  padding: 24px 0;
}
.adm-detail__block {
  margin-bottom: 16px;
}
.adm-detail__hd {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 8px;
  border-bottom: 1.5px solid var(--ink);
  padding-bottom: 4px;
}
.adm-detail__kv {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  margin: 0;
}
.adm-detail__kv > div { display: flex; justify-content: space-between; gap: 8px; }
.adm-detail__kv dt {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.adm-detail__kv dd {
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink);
  margin: 0;
}
.adm-detail__events {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}
.adm-detail__event {
  display: grid;
  grid-template-columns: 130px 110px 1fr auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 6px 4px;
  border-bottom: 1px dashed color-mix(in srgb, var(--ink) 16%, transparent);
  font-family: var(--f-mono);
  font-size: var(--text-10);
}
.adm-detail__event--crit { background: var(--crit-bg, color-mix(in srgb, #b00020 10%, transparent)); }
.adm-detail__event-time { color: var(--ink-3); }
.adm-detail__event-type {
  background: var(--paper-2);
  padding: 1px 6px;
  letter-spacing: 0.04em;
}
.adm-detail__event-typezh { color: var(--ink); }
.adm-detail__event-ip,
.adm-detail__event-dev { color: var(--ink-3); }
.adm-detail__event-fail {
  color: var(--crit, #b00020);
  background: var(--paper);
  padding: 1px 4px;
  border: 1px solid currentColor;
}
.adm-btn {
  height: 32px;
  padding: 0 14px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-11);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.adm-btn:hover { background: var(--hilite); }
.adm-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
