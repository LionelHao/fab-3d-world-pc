<script setup>
/**
 * UiFormChrome — 表单页顶部 chrome（h-bar 28h + t-bar 22h）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #1
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.h-bar / .t-bar)
 *
 * h-bar: 28h ink 条 — back 按钮 + 标题(plain + hilite 段) + 右侧 icon 按钮
 * t-bar: 22h ink 条 — led 圆点 + N 段 telemetry(plain 文案 / label+hilite value)
 */
import { computed } from 'vue'

const props = defineProps({
  /** 标题分两段: [plain, hilite]，例 ['LOGIN · ', 'ACCESS'] */
  title: { type: Array, default: () => ['', ''] },
  /** telemetry 段: string(纯文案) | [label, value] | {label, value} */
  telemetry: { type: Array, default: () => [] },
  /** t-bar 起始 led 圆点 */
  led: { type: Boolean, default: true },
  /** 右侧 icon 按钮的可读 label */
  rightLabel: { type: String, default: 'Help' },
})

defineEmits(['back', 'right-click'])

const segments = computed(() =>
  props.telemetry.map((s) => {
    if (Array.isArray(s)) return { label: s[0], value: s[1] }
    if (s && typeof s === 'object') return { label: s.label, value: s.value }
    return { label: s, value: '' }
  }),
)
</script>

<template>
  <div class="ui-form-chrome">
    <div class="ui-form-chrome__h-bar">
      <button type="button" class="ui-form-chrome__icon-btn" aria-label="Back" @click="$emit('back')">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <span class="ui-form-chrome__title">{{ title[0] }}<b>{{ title[1] }}</b></span>
      <button
        v-if="$slots['right-icon']"
        type="button"
        class="ui-form-chrome__icon-btn"
        :aria-label="rightLabel"
        @click="$emit('right-click')"
      >
        <slot name="right-icon" />
      </button>
      <span v-else class="ui-form-chrome__icon-spacer" aria-hidden="true" />
    </div>

    <div class="ui-form-chrome__t-bar" role="status" aria-label="Form status">
      <span v-if="led" class="ui-form-chrome__led" aria-hidden="true" />
      <template v-for="(seg, idx) in segments" :key="idx">
        <span v-if="idx > 0" class="ui-form-chrome__sep" aria-hidden="true">/</span>
        <span class="ui-form-chrome__seg">{{ seg.label }}<b v-if="seg.value">&nbsp;{{ seg.value }}</b></span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ui-form-chrome {
  flex-shrink: 0;
  position: relative;
  z-index: 5;
}

/* ─── h-bar (28h) ─── */
.ui-form-chrome__h-bar {
  height: 28px;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: 0 var(--space-12);
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ui-form-chrome__icon-btn {
  height: 28px;
  min-width: 28px;
  margin: 0 -6px;
  background: transparent;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--paper);
  cursor: pointer;
}
.ui-form-chrome__icon-btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1.5px var(--hilite);
}
.ui-form-chrome__icon-btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.ui-form-chrome__icon-spacer {
  width: 16px;
  height: 28px;
}

.ui-form-chrome__title {
  flex: 1;
}
.ui-form-chrome__title b {
  color: var(--hilite);
  font-weight: 700;
}

/* ─── t-bar (22h) ─── */
.ui-form-chrome__t-bar {
  height: 22px;
  background: var(--ink);
  color: var(--paper);
  border-top: 1px solid color-mix(in srgb, var(--ink) 65%, var(--ink-2));
  display: flex;
  align-items: center;
  gap: var(--space-10);
  padding: 0 var(--space-12);
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  overflow: hidden;
  white-space: nowrap;
}

.ui-form-chrome__led {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: var(--glow-accent-sm);
  flex-shrink: 0;
}

.ui-form-chrome__seg b {
  color: var(--hilite);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ui-form-chrome__sep {
  color: var(--ink-3);
}
</style>
