<script setup>
/**
 * AdminTelemetry — Ops Console 黑底遥测条（cd-9 .telemetry）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.C
 * Anchor: cd-9-desktop-admin.html line 836-855 (.telemetry)
 *
 * LED 脉冲 + N 段 mono。items 每项 [label, value?, tone?]，tone='warn' 时数值砖红橙。
 */
defineProps({
  /** items: Array<[label, value?, tone?]> */
  items: { type: Array, default: () => [] },
  live: { type: Boolean, default: true },
})
</script>

<template>
  <div class="admin-telemetry">
    <span v-if="live" class="admin-telemetry__led" aria-hidden="true"></span>
    <template v-for="(it, idx) in items" :key="idx">
      <span v-if="idx > 0" class="admin-telemetry__sep">/</span>
      <span>{{ it[0] }}<template v-if="it[1]">&nbsp;<b :class="it[2] === 'warn' ? 'admin-telemetry__warn' : ''">{{ it[1] }}</b></template></span>
    </template>
  </div>
</template>

<style scoped>
.admin-telemetry {
  height: 30px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--f-mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--ink);
  overflow: hidden;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.admin-telemetry__led {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: 0 0 8px var(--hilite);
  flex-shrink: 0;
  animation: admin-telemetry-pulse 1.6s ease-in-out infinite;
}
@keyframes admin-telemetry-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.admin-telemetry b { color: var(--hilite); font-weight: 600; }
.admin-telemetry__warn { color: var(--semantic-warning); }
.admin-telemetry__sep { color: var(--ink-3); }
</style>
