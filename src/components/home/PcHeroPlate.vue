<script setup>
/**
 * PcHeroPlate — HERO 左半 specimen plate
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.4.1
 * Anchor: cd-3-desktop.html line 1373-1541 + CSS line 285-457
 *
 * 槽位: 装饰 chrome (head/crosshairs/readouts/scale-ruler) + render slot 供 SVG/3D viewer
 */
defineProps({
  data: { type: Object, required: true }, // heroFixture.plate + sample/rev/class/certified
  sampleCode: { type: String, required: true },
  rev: { type: String, default: '' },
  sampleClass: { type: String, default: '' },
  certified: { type: Boolean, default: false },
})
</script>

<template>
  <div class="pc-plate">
    <div class="pc-plate__head">
      <div class="pc-plate__head-left">
        <span>SAMPLE</span>
        <b>{{ sampleCode }}</b>
        <span v-if="rev || sampleClass">· REV {{ rev }} · CLASS {{ sampleClass }}</span>
      </div>
      <div v-if="certified" class="pc-plate__head-right">CERTIFIED ✓</div>
    </div>

    <div class="pc-plate__canvas">
      <span class="pc-plate__crosshair pc-plate__crosshair--tl"></span>
      <span class="pc-plate__crosshair pc-plate__crosshair--tr"></span>
      <span class="pc-plate__crosshair pc-plate__crosshair--bl"></span>
      <span class="pc-plate__crosshair pc-plate__crosshair--br"></span>

      <div class="pc-plate__readout">
        <div>{{ data.figure }}</div>
        <div class="dim">{{ data.scale }}</div>
        <div class="dim">{{ data.dim }}</div>
      </div>
      <div class="pc-plate__readout-r">
        <div>MASS · <b>{{ data.mass }}</b></div>
        <div>POLY · <b>{{ data.poly }}</b></div>
        <div>PARTS · <b>{{ data.parts }}</b></div>
      </div>

      <div class="pc-plate__render">
        <slot name="render">
          <svg viewBox="0 0 700 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <ellipse cx="350" cy="420" rx="280" ry="18" fill="rgba(20,21,15,0.1)"/>
            <text x="350" y="270" font-family="IBM Plex Mono" font-size="14" font-weight="600" fill="#5A6E1A" text-anchor="middle" letter-spacing="0.1em">
              3D RENDER · SLOT
            </text>
            <text x="350" y="290" font-family="IBM Plex Mono" font-size="10" font-weight="500" fill="#8A8C7F" text-anchor="middle" letter-spacing="0.1em">
              {{ sampleCode }}
            </text>
          </svg>
        </slot>
      </div>

      <div class="pc-plate__scale-ruler" aria-hidden="true">
        <span class="tick long"></span>
        <span class="tick"></span><span class="tick"></span><span class="tick"></span><span class="tick"></span>
        <span class="tick long"></span>
        <span class="tick"></span><span class="tick"></span><span class="tick"></span><span class="tick"></span>
        <span class="tick long"></span>
        <span class="tick"></span><span class="tick"></span><span class="tick"></span><span class="tick"></span>
        <span class="tick long"></span>
        <span class="label">{{ data.scaleRulerLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-plate {
  border: 1.5px solid var(--ink);
  background: var(--paper);
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}
.pc-plate__head {
  background: var(--ink);
  color: var(--paper);
  height: 32px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.pc-plate__head-left { display: flex; align-items: center; gap: 12px; }
.pc-plate__head-left b { color: var(--hilite); font-weight: 600; }
.pc-plate__head-right {
  background: var(--hilite);
  color: var(--ink);
  padding: 0 12px;
  height: 32px;
  margin-right: -16px;
  display: flex;
  align-items: center;
  font-weight: 700;
}

.pc-plate__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.pc-plate__canvas::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(20,21,15,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20,21,15,0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(80% 80% at 50% 55%, #000 0%, transparent 100%);
  -webkit-mask-image: radial-gradient(80% 80% at 50% 55%, #000 0%, transparent 100%);
  pointer-events: none;
}
.pc-plate__canvas::after {
  content: "";
  position: absolute;
  inset: 28% 14% 10% 14%;
  background: radial-gradient(closest-side, rgba(212,242,58,0.28), transparent 70%);
  pointer-events: none;
}

.pc-plate__crosshair {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--accent-link);
  z-index: 3;
}
.pc-plate__crosshair--tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.pc-plate__crosshair--tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
.pc-plate__crosshair--bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
.pc-plate__crosshair--br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

.pc-plate__readout {
  position: absolute;
  top: 18px;
  left: 44px;
  font-family: var(--f-mono);
  font-size: 10px;
  line-height: 1.7;
  color: var(--accent-link);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  z-index: 3;
  font-weight: 600;
}
.pc-plate__readout .dim { color: var(--ink-2); font-weight: 500; }

.pc-plate__readout-r {
  position: absolute;
  top: 18px;
  right: 44px;
  font-family: var(--f-mono);
  font-size: 10px;
  line-height: 1.7;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  z-index: 3;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.pc-plate__readout-r b { color: var(--ink); font-weight: 600; }

.pc-plate__render {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.pc-plate__render :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  animation: pc-plate-float 5s ease-in-out infinite;
}
@keyframes pc-plate-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.pc-plate__scale-ruler {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  z-index: 3;
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-2);
  letter-spacing: 0.1em;
}
.pc-plate__scale-ruler .tick {
  width: 1.5px;
  height: 6px;
  background: var(--ink-2);
  margin-right: 12px;
}
.pc-plate__scale-ruler .tick.long {
  height: 10px;
  background: var(--ink);
}
.pc-plate__scale-ruler .label {
  margin-left: 6px;
  transform: translateY(-1px);
  text-transform: uppercase;
  color: var(--ink);
  font-weight: 600;
}
</style>
