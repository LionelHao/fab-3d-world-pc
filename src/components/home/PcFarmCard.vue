<script setup>
/**
 * PcFarmCard — PRINT FARM 单卡（实时进度）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.7
 * Anchor: cd-3-desktop.html line 2058-2241 + CSS line 1047-1247
 */
defineProps({
  job: { type: Object, required: true },
})
</script>

<template>
  <article class="pc-farm-card">
    <header class="pc-farm-card__head">
      <span class="pc-farm-card__live">
        <span class="pc-farm-card__led" aria-hidden="true"></span>
        LIVE · {{ job.cam }}
      </span>
      <span class="pc-farm-card__job-id">{{ job.printerModel }} {{ job.jobId }}</span>
    </header>

    <div class="pc-farm-card__img">
      <span class="pc-farm-card__corner pc-farm-card__corner--tl"></span>
      <span class="pc-farm-card__corner pc-farm-card__corner--tr"></span>
      <span class="pc-farm-card__corner pc-farm-card__corner--bl"></span>
      <span class="pc-farm-card__corner pc-farm-card__corner--br"></span>
      <slot name="img">
        <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <ellipse cx="160" cy="158" rx="120" ry="6" fill="var(--ink)" fill-opacity="0.1"/>
          <rect x="40" y="120" width="240" height="14" fill="var(--ink)" fill-opacity="0.12" stroke="var(--ink)" stroke-width="1"/>
          <rect x="40" y="118" width="240" height="2" fill="var(--ink)"/>
          <text x="160" y="80" font-family="IBM Plex Mono" font-size="11" font-weight="600" fill="var(--accent-link)" text-anchor="middle" letter-spacing="0.1em">
            LIVE STREAM
          </text>
          <text x="160" y="98" font-family="IBM Plex Mono" font-size="9" fill="var(--ink-3)" text-anchor="middle">
            {{ job.cam }}
          </text>
        </svg>
      </slot>
    </div>

    <div class="pc-farm-card__body">
      <div class="pc-farm-card__title">{{ job.title }}</div>
      <span class="pc-farm-card__by">printing for <b>{{ job.printingFor }}</b></span>
      <div class="pc-farm-card__progress-row">
        <span class="pc-farm-card__pct">{{ job.progressPct }}%</span>
        <span class="pc-farm-card__eta">ETA · <b>{{ job.etaText }}</b></span>
      </div>
      <div class="pc-farm-card__progress" role="progressbar" :aria-valuenow="job.progressPct" aria-valuemin="0" aria-valuemax="100">
        <div class="pc-farm-card__bar" :style="{ width: `${job.progressPct}%` }"></div>
      </div>
      <div class="pc-farm-card__specs-line">
        <span>{{ job.specs.layerHeight }} · {{ job.specs.infill }}</span>
        <span><b>{{ job.specs.material }}</b> {{ job.specs.color }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pc-farm-card {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  min-width: 280px;
}

.pc-farm-card__head {
  background: var(--ink);
  color: var(--paper);
  height: 26px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-farm-card__live { display: inline-flex; align-items: center; gap: 6px; color: var(--hilite); }
.pc-farm-card__led {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: 0 0 4px var(--hilite);
  flex-shrink: 0;
  animation: pc-farm-led-pulse 1.6s ease-in-out infinite;
}
@keyframes pc-farm-led-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.pc-farm-card__job-id { font-variant-numeric: tabular-nums; }

.pc-farm-card__img {
  aspect-ratio: 16 / 9;
  position: relative;
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
  overflow: hidden;
}
.pc-farm-card__corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--accent-link);
  z-index: 2;
}
.pc-farm-card__corner--tl { top: 6px; left: 6px; border-right: 0; border-bottom: 0; }
.pc-farm-card__corner--tr { top: 6px; right: 6px; border-left: 0; border-bottom: 0; }
.pc-farm-card__corner--bl { bottom: 6px; left: 6px; border-right: 0; border-top: 0; }
.pc-farm-card__corner--br { bottom: 6px; right: 6px; border-left: 0; border-top: 0; }
.pc-farm-card__img :deep(svg) { width: 100%; height: 100%; display: block; }

.pc-farm-card__body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pc-farm-card__title {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  text-transform: uppercase;
  line-height: 1.1;
}
.pc-farm-card__by {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
}
.pc-farm-card__by b { color: var(--ink); font-weight: 600; }

.pc-farm-card__progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
}
.pc-farm-card__pct {
  background: var(--accent-link);
  color: var(--hilite);
  font-size: 14px;
  font-weight: 700;
  padding: 2px 8px;
  letter-spacing: 0.02em;
}
.pc-farm-card__eta {
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.pc-farm-card__eta b { color: var(--ink); font-weight: 600; }

.pc-farm-card__progress {
  height: 6px;
  background: var(--paper-3);
  border: 1px solid var(--ink);
  position: relative;
}
.pc-farm-card__bar {
  height: 100%;
  background: var(--hilite);
  transition: width 280ms ease-out;
}

.pc-farm-card__specs-line {
  display: flex;
  flex-direction: column;
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}
.pc-farm-card__specs-line b { color: var(--ink); font-weight: 600; }
</style>
