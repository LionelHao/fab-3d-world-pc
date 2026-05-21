<script setup>
/**
 * PcAchievementCard — 成就徽章卡（cd-8 .ach）
 *
 * Spec: docs/design/specs/p3.10-profile.md §3.D
 * Anchor: cd-8-desktop-profile.html line 802-903, 1288-1397 (.ach …)
 *
 * ahd(BADGE + ix) + badge(80×80 SVG art) + body(title + meta)。
 * badge SVG 1:1 内联自 cd-8（装饰图样，4 型：gear / shield / bolt / star）。
 */
defineProps({
  ix: { type: String, default: '' },
  /** gear | shield | bolt | star */
  badge: { type: String, default: 'gear' },
  title: { type: String, required: true },
  meta: { type: String, default: '' },
})
</script>

<template>
  <article class="pc-ach">
    <div class="pc-ach__hd">
      <span>BADGE</span><span class="pc-ach__ix">{{ ix }}</span>
    </div>
    <div class="pc-ach__badge">
      <!-- gear -->
      <svg v-if="badge === 'gear'" viewBox="0 0 100 100" aria-hidden="true">
        <g transform="translate(50 50)">
          <path class="b-stroke" d="M0 -34 L6 -34 L8 -28 L14 -26 L20 -30 L24 -26 L20 -20 L22 -14 L28 -12 L32 -6 L28 0 L32 6 L28 12 L22 14 L20 20 L24 26 L20 30 L14 26 L8 28 L6 34 L0 34 L-6 34 L-8 28 L-14 26 L-20 30 L-24 26 L-20 20 L-22 14 L-28 12 L-32 6 L-28 0 L-32 -6 L-28 -12 L-22 -14 L-20 -20 L-24 -26 L-20 -30 L-14 -26 L-8 -28 L-6 -34 Z" />
          <circle r="14" class="b-hilite b-stroke2" />
          <text y="5" class="b-text" font-size="13" text-anchor="middle">III</text>
        </g>
      </svg>
      <!-- shield -->
      <svg v-else-if="badge === 'shield'" viewBox="0 0 100 100" aria-hidden="true">
        <g transform="translate(50 56)">
          <path class="b-stroke" d="M-26 -34 L26 -34 L28 -10 Q28 18 0 32 Q-28 18 -28 -10 Z" />
          <g transform="translate(0 -2) scale(0.85)">
            <circle cx="-12" cy="6" r="3.5" class="b-ink" />
            <circle cx="-6" cy="3" r="4.5" class="b-ink" />
            <circle cx="0" cy="0" r="5" class="b-ink" />
            <circle cx="7" cy="-3" r="4.5" class="b-ink" />
            <path d="M12 -10 Q22 -16 22 -2 Q18 6 8 4 Z" class="b-ink" />
            <path d="M14 -8 Q20 -12 20 -3 Q18 3 9 2 Z" class="b-hilite" />
            <path d="M18 -12 L20 -22 L22 -12 Z" class="b-accent" />
          </g>
          <rect x="-22" y="22" width="44" height="10" class="b-ink" />
          <text x="0" y="29" class="b-text-hilite" font-size="6" text-anchor="middle">8 MO · V3</text>
        </g>
      </svg>
      <!-- bolt -->
      <svg v-else-if="badge === 'bolt'" viewBox="0 0 100 100" aria-hidden="true">
        <g transform="translate(50 50)">
          <polygon class="b-stroke" points="-22,-34 22,-34 34,-22 34,22 22,34 -22,34 -34,22 -34,-22" />
          <polygon class="b-hatch" points="-22,-34 22,-34 34,-22 34,22 22,34 -22,34 -34,22 -34,-22" />
          <path class="b-hilite b-stroke2" d="M-4 -22 L10 -22 L0 0 L12 0 L-6 24 L0 6 L-12 6 Z" />
          <text x="0" y="32" class="b-text" font-size="5" text-anchor="middle">PIONEER</text>
        </g>
      </svg>
      <!-- star -->
      <svg v-else viewBox="0 0 100 100" aria-hidden="true">
        <g transform="translate(50 50)">
          <circle r="34" class="b-stroke" />
          <g class="b-petal">
            <line x1="0" y1="-34" x2="0" y2="-26" /><line x1="24" y1="-24" x2="18" y2="-18" />
            <line x1="34" y1="0" x2="26" y2="0" /><line x1="24" y1="24" x2="18" y2="18" />
            <line x1="0" y1="34" x2="0" y2="26" /><line x1="-24" y1="24" x2="-18" y2="18" />
            <line x1="-34" y1="0" x2="-26" y2="0" /><line x1="-24" y1="-24" x2="-18" y2="-18" />
          </g>
          <polygon class="b-hilite b-stroke2" points="0,-18 5,-6 18,-6 8,2 12,14 0,7 -12,14 -8,2 -18,-6 -5,-6" />
          <text y="32" class="b-text" font-size="6" text-anchor="middle">4.8 / 5</text>
        </g>
      </svg>
    </div>
    <div class="pc-ach__body">
      <div class="pc-ach__t">{{ title }}</div>
      <div v-if="meta" class="pc-ach__m">{{ meta }}</div>
    </div>
  </article>
</template>

<style scoped>
.pc-ach {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
}
.pc-ach__hd {
  background: var(--ink);
  color: var(--paper);
  padding: 4px 8px;
  font-family: var(--f-mono);
  font-size: var(--text-9);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pc-ach__ix { color: var(--hilite); font-weight: 600; }

.pc-ach__badge {
  flex: 1;
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.pc-ach__badge::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ink) 6%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 6%, transparent) 1px, transparent 1px);
  background-size: 8px 8px;
  mask-image: radial-gradient(80% 80% at 50% 60%, #000 0%, transparent 100%);
  -webkit-mask-image: radial-gradient(80% 80% at 50% 60%, #000 0%, transparent 100%);
}
.pc-ach__badge::after {
  content: "";
  position: absolute;
  inset: 20% 25% 25% 25%;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--hilite) 35%, transparent), transparent 70%);
}
.pc-ach__badge svg {
  width: 80px;
  height: 80px;
  position: relative;
  z-index: 2;
}

/* badge SVG fill helpers (装饰图样 → token) */
.b-stroke { stroke: var(--ink); stroke-width: 2; fill: none; stroke-linejoin: round; stroke-linecap: round; }
.b-stroke2 { stroke: var(--ink); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.b-ink { fill: var(--ink); }
.b-hilite { fill: var(--hilite); }
.b-accent { fill: var(--accent-link); }
.b-petal { stroke: var(--accent-link); stroke-width: 1.4; fill: none; }
.b-hatch { fill: color-mix(in srgb, var(--ink) 14%, transparent); }
.b-text {
  font-family: var(--f-mono);
  font-weight: 700;
  fill: var(--ink);
  letter-spacing: 0.1em;
}
.b-text-hilite {
  font-family: var(--f-mono);
  font-weight: 700;
  fill: var(--hilite);
  letter-spacing: 0.1em;
}

.pc-ach__body {
  padding: 8px 10px 10px;
  border-top: 1.5px solid var(--ink);
  background: var(--paper-2);
  text-align: center;
}
.pc-ach__t {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-12);
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
  line-height: 1.1;
}
.pc-ach__m {
  margin-top: 3px;
  font-family: var(--f-mono);
  font-size: 8.5px;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 500;
}
</style>
