<script setup>
/**
 * AdminKpiCard — Ops Console KPI 卡（cd-9 .kpi）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.B
 * Anchor: cd-9-desktop-admin.html line 329-424, 919-989 (.kpi / .kpi-head / .kpi-delta / .kpi-spark)
 *
 * kpi-head(ix + tag + stamp[tone]) + kpi-body(label + 48px 大数 + kpi-delta:
 * 方向箭头 svg + delta 文字 + spark 80×28 svg polyline + 端点圆)。
 */
import { computed } from 'vue'

const props = defineProps({
  /** 'KPI · 01' */
  ix: { type: String, default: '' },
  /** 'DAU' */
  tag: { type: String, default: '' },
  /** 'MON 09:41' */
  stamp: { type: String, default: '' },
  /** '' | 'crit' */
  stampTone: { type: String, default: '' },
  label: { type: String, default: '' },
  value: { type: String, default: '' },
  /** 数值后缀单位，如 '/ ¥4,892' */
  unit: { type: String, default: '' },
  /** '' | 'crit' — 大数字危险色 */
  valTone: { type: String, default: '' },
  delta: { type: String, default: '' },
  /** 'up' | 'down' */
  deltaDir: { type: String, default: 'up' },
  /** '' | 'warn' | 'crit' */
  deltaTone: { type: String, default: '' },
  /** SVG polyline points 字符串 (viewBox 0 0 80 28) */
  spark: { type: String, default: '' },
  /** '' | 'crit' — spark 描边色 */
  sparkTone: { type: String, default: '' },
})

/** spark points 字符串末点坐标，用于绘制端点圆 */
const sparkEnd = computed(() => {
  const pts = String(props.spark || '').trim().split(/\s+/)
  const last = pts[pts.length - 1]
  if (!last) return null
  const [x, y] = last.split(',').map(Number)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
})
</script>

<template>
  <article class="admin-kpi">
    <header class="admin-kpi__head">
      <div class="admin-kpi__hl">
        <span class="admin-kpi__ix">{{ ix }}</span>
        <span>{{ tag }}</span>
      </div>
      <span
        class="admin-kpi__stamp"
        :class="stampTone ? `admin-kpi__stamp--${stampTone}` : ''"
      >{{ stamp }}</span>
    </header>

    <div class="admin-kpi__body">
      <span class="admin-kpi__label">{{ label }}</span>
      <span class="admin-kpi__val" :class="valTone ? `admin-kpi__val--${valTone}` : ''">
        {{ value }}<span v-if="unit" class="admin-kpi__unit">{{ unit }}</span>
      </span>

      <div class="admin-kpi__delta">
        <span class="admin-kpi__d" :class="deltaTone ? `admin-kpi__d--${deltaTone}` : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path v-if="deltaDir === 'down'" d="M12 5v14M6 13l6 6 6-6" />
            <path v-else d="M12 19V5M6 11l6-6 6 6" />
          </svg>
          {{ delta }}
        </span>
        <svg v-if="spark" class="admin-kpi__spark" viewBox="0 0 80 28" aria-hidden="true">
          <polyline
            fill="none"
            :stroke="sparkTone === 'crit' ? 'var(--semantic-danger)' : 'var(--accent-link)'"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="spark"
          />
          <circle
            v-if="sparkEnd"
            :cx="sparkEnd.x"
            :cy="sparkEnd.y"
            r="2"
            :fill="sparkTone === 'crit' ? 'var(--semantic-danger)' : 'var(--hilite)'"
            stroke="var(--ink)"
            stroke-width="1"
          />
        </svg>
      </div>
    </div>
  </article>
</template>

<style scoped>
.admin-kpi {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  min-height: 168px;
}
.admin-kpi__head {
  background: var(--ink);
  color: var(--paper);
  padding: 5px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.admin-kpi__hl { display: flex; align-items: baseline; gap: 6px; }
.admin-kpi__ix { color: var(--hilite); font-weight: 600; }
.admin-kpi__stamp {
  background: var(--hilite);
  color: var(--ink);
  padding: 1px 5px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.admin-kpi__stamp--crit {
  background: var(--semantic-danger);
  color: var(--paper);
}
.admin-kpi__body {
  padding: 14px 14px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-kpi__label {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}
.admin-kpi__val {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 48px;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.admin-kpi__val--crit { color: var(--semantic-danger); }
.admin-kpi__unit {
  font-family: var(--f-mono);
  font-size: 14px;
  color: var(--ink-3);
  font-weight: 500;
  margin-left: 4px;
}
.admin-kpi__val--crit .admin-kpi__unit { color: var(--semantic-danger); }
.admin-kpi__delta {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--ink-2);
}
.admin-kpi__d {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent-link);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.admin-kpi__d--warn { color: var(--semantic-warning); }
.admin-kpi__d--crit { color: var(--semantic-danger); }
.admin-kpi__d svg { width: 12px; height: 12px; }
.admin-kpi__spark { width: 80px; height: 28px; flex-shrink: 0; }
</style>
