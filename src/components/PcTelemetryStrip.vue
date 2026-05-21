<script setup>
/**
 * PcTelemetryStrip — 黑底遥测状态条
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.3
 * Anchor: cd-3-desktop.html line 239-264, 1353-1367
 *
 * 6 段固定显示: LIVE / NETWORK / FARM / SAMPLES / REV / SYNC
 */
defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <div class="pc-telemetry">
    <span class="pc-telemetry__led" aria-hidden="true"></span>
    <span>LIVE</span>
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
  </div>
</template>

<style scoped>
.pc-telemetry {
  background: var(--ink);
  color: var(--paper);
  font-family: var(--f-mono);
  font-size: 10px;
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
