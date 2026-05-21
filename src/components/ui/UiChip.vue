<script setup>
/**
 * UiChip — 原子 chip 组件（PC 版，从 mobile 移植 + 扩展 count slot + lg size）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.5.2, §2 (chip h=32 px=12)
 * Anchor: docs/design/inspiration/cd-3-desktop.html line 713-747
 *
 * 必须覆盖变体:
 *  - default / active 双态
 *  - 含 / 不含 indexLabel (例 "01")
 *  - 含 / 不含 count (例 "2,841")
 *  - size sm / md / lg (cd-3 desktop chip 用 lg, h=32 px=12)
 *  - hover / pressed / focus-visible
 */
defineProps({
  label: { type: String, required: true },
  active: { type: Boolean, default: false },
  size: { type: String, default: 'lg', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  indexLabel: { type: String, default: '' },
  count: { type: [String, Number], default: '' },
  ariaLabel: { type: String, default: '' },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="ui-chip"
    :class="[`ui-chip--${size}`, { 'ui-chip--active': active }]"
    :aria-pressed="active"
    :aria-label="ariaLabel || label"
    @click="$emit('click', $event)"
  >
    <slot name="leadingIcon" />
    <span v-if="indexLabel" class="ui-chip__ix">{{ indexLabel }}</span>
    <span class="ui-chip__label">{{ label }}</span>
    <span v-if="count !== '' && count !== null && count !== undefined" class="ui-chip__count">{{ count }}</span>
    <slot name="trailingIcon" />
  </button>
</template>

<style scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}

.ui-chip--lg {
  height: 32px;
  padding: 0 var(--space-12);
  font-size: 11px;
}

.ui-chip--md {
  padding: 7px var(--space-10);
  font-size: 11px;
}

.ui-chip--sm {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-xs);
}

.ui-chip__ix {
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-3);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.ui-chip__count {
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-3);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.ui-chip__label {
  line-height: 1;
}

.ui-chip:hover:not(.ui-chip--active):not(:disabled) {
  background: var(--paper-3);
}

.ui-chip:active:not(:disabled) {
  background: var(--paper-3);
  transform: translateY(0.5px);
}

.ui-chip:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.ui-chip--active {
  background: var(--ink);
  color: var(--hilite);
}

.ui-chip--active .ui-chip__ix {
  color: var(--paper);
  opacity: 0.5;
}

.ui-chip--active .ui-chip__count {
  color: var(--paper);
  opacity: 0.6;
}

.ui-chip--active:hover {
  box-shadow: var(--glow-accent-sm);
}

.ui-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
