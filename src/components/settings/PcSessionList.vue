<script setup>
/**
 * PcSessionList — 已登录设备列表（user-auth P3）
 *
 * Spec: docs/user-auth-impl.md §4.1
 * Backend DTO: SessionInfo { tokenValue, deviceType, ip, userAgent, loginAt, current }
 *
 * 渲染：
 *   - 表头: device / ip / loginAt / actions
 *   - 行内 "Current" chip 高亮当前会话；Revoke 按钮 disabled
 *   - 非当前会话 Revoke 按钮 emit('revoke', tokenValue)
 *   - 列表 ≥ 2 行（含至少 1 非当前）显示 "Sign out other devices" 按钮 emit('revoke-others')
 *   - 空态 / loading 文案
 *
 * Paper-CAD token 严格使用；不出现硬编码色值 / 圆角 / 字号。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['revoke', 'revoke-others'])

const { t } = useI18n()

const DEVICE_LABEL_KEYS = {
  pc: 'settings.security.sessions.deviceDesktop',
  web: 'settings.security.sessions.deviceWeb',
  mobile: 'settings.security.sessions.deviceMobile',
  desktop: 'settings.security.sessions.deviceDesktop',
}

function deviceLabel(d) {
  const k = DEVICE_LABEL_KEYS[String(d || '').toLowerCase()]
  return k ? t(k) : t('settings.security.sessions.deviceUnknown')
}

function formatTime(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const hasOthers = computed(() => props.sessions.some((s) => !s.current))
const isEmpty = computed(() => !props.loading && props.sessions.length === 0)

function onRevoke(tokenValue) {
  emit('revoke', tokenValue)
}
function onRevokeOthers() {
  emit('revoke-others')
}
</script>

<template>
  <div class="pc-session-list">
    <div v-if="loading" class="pc-session-list__hint">
      {{ t('settings.security.sessions.loading') }}
    </div>
    <div v-else-if="isEmpty" class="pc-session-list__hint">
      {{ t('settings.security.sessions.empty') }}
    </div>

    <table v-else class="pc-session-list__table">
      <thead>
        <tr>
          <th>{{ t('settings.security.sessions.col.device') }}</th>
          <th>{{ t('settings.security.sessions.col.ip') }}</th>
          <th>{{ t('settings.security.sessions.col.loginAt') }}</th>
          <th class="pc-session-list__th-act">{{ t('settings.security.sessions.col.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="s in sessions"
          :key="s.tokenValue"
          :class="{ 'pc-session-list__row--curr': s.current }"
        >
          <td>
            <span class="pc-session-list__device">{{ deviceLabel(s.deviceType) }}</span>
            <span v-if="s.current" class="pc-session-list__chip">
              {{ t('settings.security.sessions.current') }}
            </span>
          </td>
          <td class="pc-session-list__mono">{{ s.ip || '—' }}</td>
          <td class="pc-session-list__mono">{{ formatTime(s.loginAt) }}</td>
          <td>
            <button
              type="button"
              class="pc-session-list__revoke"
              :data-testid="`revoke-btn-${s.tokenValue}`"
              :disabled="s.current"
              :aria-label="t('settings.security.sessions.revokeAria', { device: deviceLabel(s.deviceType) })"
              @click="onRevoke(s.tokenValue)"
            >
              {{ t('settings.security.sessions.revoke') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="hasOthers" class="pc-session-list__foot">
      <button
        type="button"
        class="pc-session-list__revoke-others"
        data-testid="revoke-others-btn"
        @click="onRevokeOthers"
      >
        {{ t('settings.security.sessions.revokeOthers') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pc-session-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-14);
  background: var(--paper);
}

.pc-session-list__hint {
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: var(--space-20);
  text-align: center;
  border: 1px dashed var(--ink-3);
}

.pc-session-list__table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink);
}

.pc-session-list__table thead th {
  background: var(--ink);
  color: var(--paper);
  text-align: left;
  padding: var(--space-6) var(--space-10);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: var(--text-10);
}
.pc-session-list__th-act { width: 120px; text-align: right; }

.pc-session-list__table tbody td {
  padding: var(--space-10);
  border-bottom: 1px solid var(--paper-3);
  vertical-align: middle;
}
.pc-session-list__table tbody tr:last-child td { border-bottom: 1.5px solid var(--ink); }

.pc-session-list__row--curr td { background: var(--paper-3); }

.pc-session-list__device {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.pc-session-list__chip {
  display: inline-block;
  margin-left: var(--space-6);
  padding: 1px var(--space-6);
  background: var(--hilite);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-session-list__mono {
  font-feature-settings: 'tnum';
  color: var(--ink-2);
}

.pc-session-list__revoke {
  border: 1px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px var(--space-10);
  cursor: pointer;
  border-radius: var(--radius-none);
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-session-list__revoke:hover:not(:disabled) { background: var(--paper-3); box-shadow: var(--glow-accent-sm); }
.pc-session-list__revoke:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-session-list__revoke:disabled { opacity: 0.4; cursor: not-allowed; }

.pc-session-list__foot {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-8);
  border-top: 1px dashed var(--ink-3);
}
.pc-session-list__revoke-others {
  background: var(--ink);
  color: var(--hilite);
  border: 1.5px solid var(--ink);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-13);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--space-8) var(--space-16);
  cursor: pointer;
  border-radius: var(--radius-none);
  transition: box-shadow 120ms ease-out;
}
.pc-session-list__revoke-others:hover { box-shadow: var(--glow-accent-md); }
.pc-session-list__revoke-others:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
