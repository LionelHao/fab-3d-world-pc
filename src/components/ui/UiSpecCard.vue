<script setup>
/**
 * UiSpecCard (PC) — CAD spec sheet 数据卡片 (cd-4 style, 3-col grid 默认)
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3.3
 * Anchor: cd-4-desktop.html line 1520-1543 (.section + .eyebrow + .data-grid 3×2)
 *
 * 与 mobile UiSpecCard 的差异:
 *  - .eyebrow 单行 (num + title + stamp 同行) 而非 section-hd + section-rule 两段
 *  - 默认 3-col 而非 2-col (PC 横向密度更高)
 *  - cols 可切换 2 / 3 兼容不同段
 */
import { computed } from 'vue'

const props = defineProps({
  num: { type: String, required: true },
  title: { type: String, required: true },
  stamp: { type: String, default: '' },
  /**
   * cells: Array<{ k: string, v: string, vSmall?: string, vEm?: boolean }>
   */
  cells: { type: Array, default: () => [] },
  /** 列数 (默认 3, mobile 兼容 2) */
  cols: { type: Number, default: 3, validator: (v) => [1, 2, 3].includes(v) },
})

const effectiveCols = computed(() => {
  if (!props.cells || props.cells.length === 0) return 1
  return Math.min(props.cols, props.cells.length)
})
</script>

<template>
  <section class="ui-spec-card-pc">
    <div class="ui-spec-card-pc__eyebrow">
      <span class="ui-spec-card-pc__brow-text">
        <span class="ui-spec-card-pc__num">{{ num }}</span>
        <span class="ui-spec-card-pc__title">· {{ title }}</span>
      </span>
      <span v-if="stamp" class="ui-spec-card-pc__stamp">{{ stamp }}</span>
    </div>

    <div
      class="ui-spec-card-pc__grid"
      :class="`ui-spec-card-pc__grid--cols-${effectiveCols}`"
    >
      <div
        v-for="(cell, idx) in cells"
        :key="idx"
        class="ui-spec-card-pc__cell"
      >
        <span class="ui-spec-card-pc__cell-k">{{ cell.k }}</span>
        <span class="ui-spec-card-pc__cell-v">
          <span v-if="cell.vEm" class="ui-spec-card-pc__cell-v-em">{{ cell.v }}</span>
          <template v-else>{{ cell.v }}</template>
          <small v-if="cell.vSmall">{{ cell.vSmall }}</small>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-spec-card-pc {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  margin-bottom: 16px;
}

.ui-spec-card-pc__eyebrow {
  background: var(--ink);
  color: var(--paper);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-spec-card-pc__brow-text {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.ui-spec-card-pc__num {
  color: var(--hilite);
  font-weight: 700;
}

.ui-spec-card-pc__title {
  color: var(--paper);
  font-weight: 500;
}

.ui-spec-card-pc__stamp {
  color: var(--ink-3);
  font-weight: 600;
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.ui-spec-card-pc__grid {
  display: grid;
  gap: 1.5px;
  background: var(--ink);
}
.ui-spec-card-pc__grid--cols-1 { grid-template-columns: 1fr; }
.ui-spec-card-pc__grid--cols-2 { grid-template-columns: 1fr 1fr; }
.ui-spec-card-pc__grid--cols-3 { grid-template-columns: 1fr 1fr 1fr; }

.ui-spec-card-pc__cell {
  background: var(--paper);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ui-spec-card-pc__cell-k {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ui-spec-card-pc__cell-v {
  font-family: var(--f-mono);
  font-size: var(--text-15);
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
}

.ui-spec-card-pc__cell-v small {
  color: var(--ink-3);
  font-weight: 500;
  margin-left: 2px;
  font-size: var(--text-11);
}

.ui-spec-card-pc__cell-v-em {
  color: var(--ink);
  background: var(--hilite);
  padding: 0 4px;
}
</style>
