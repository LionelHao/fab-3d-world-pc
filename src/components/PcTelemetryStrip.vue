<script setup>
/**
 * PcTelemetryStrip — 黑底遥测状态条
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.3 · p3.10-profile.md §3.A
 * Anchor: cd-3-desktop.html line 239-264 · cd-8-desktop-profile.html line 234-261
 *
 * 两种模式:
 *  - 默认: 6 段固定 LIVE / NETWORK / FARM / SAMPLES / REV / SYNC（传 data）
 *  - 自定义: 传 items=[[label,value], …]，完全替换段位（T3.10.5 扩展，cd-8 profile）
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  data: { type: Object, default: () => null },
  /** 自定义段位 [[label, value], …]；非空则替换固定 6 段 */
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="pc-telemetry">
    <span class="pc-telemetry__led" aria-hidden="true"></span>
    <!-- 自定义段位模式 (cd-8 profile) -->
    <template v-if="items.length">
      <template v-for="(it, idx) in items" :key="idx">
        <span v-if="idx > 0" class="pc-telemetry__sep">/</span>
        <span>{{ it[0] }}<template v-if="it[1]">&nbsp;<b>{{ it[1] }}</b></template></span>
      </template>
    </template>
    <!-- 固定 6 段模式 (cd-3 home) -->
    <template v-else-if="data">
      <span>{{ t('common.telemetry.live') }}</span>
      <span class="pc-telemetry__sep">/</span>
      <span>NETWORK <b>{{ data.network.value }} {{ data.network.unit }}</b></span>
      <span class="pc-telemetry__sep">/</span>
      <span>FARM <b>{{ data.farm.value }} {{ data.farm.unit }}</b></span>
      <span class="pc-telemetry__sep">/</span>
      <span>SAMPLES <b>{{ data.samples.value }}</b></span>
      <span class="pc-telemetry__sep">/</span>
      <span>REV <b>{{ data.rev }}</b></span>
      <span class="pc-telemetry__sep">/</span>
      <span>SYNC <b>{{ (data.syncMs / 1000).toFixed(2) }}s</b></span>
    </template>
  </div>
</template>

<style scoped>
.pc-telemetry {
  background: var(--ink);
  color: var(--paper);
  font-family: var(--f-mono);
  font-size: var(--text-10);
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 6px 80px;
  display: flex;
  align-items: center;
  gap: 18px;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--ink);
  overflow: hidden;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.pc-telemetry__led {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: 0 0 8px var(--hilite);
  flex-shrink: 0;
  animation: pc-telemetry-pulse 1.6s ease-in-out infinite;
}
@keyframes pc-telemetry-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.pc-telemetry b { color: var(--hilite); font-weight: 600; }
.pc-telemetry__sep { color: var(--ink-3); }
</style>
