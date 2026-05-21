<script setup>
/**
 * UiButton — 表单 CTA 按钮（.btn-primary / .btn-secondary）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #10
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.btn-primary / .btn-secondary)
 *
 * primary: hilite 底 + 4 角 corner bracket + 右侧 size 徽标（badge）
 * secondary: paper 底 + 居中 icon + 文案
 */
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary'].includes(v),
  },
  /** primary 右侧 size 徽标文案，例 '8.2 MB' / '/AUTH' / 'OPEN' */
  badge: { type: String, default: '' },
  badgeTone: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'warn'].includes(v),
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    class="ui-button"
    :class="[`ui-button--${variant}`, { 'ui-button--disabled': disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span class="ui-button__left">
      <slot name="icon" />
      <span class="ui-button__label"><slot /></span>
    </span>
    <span
      v-if="variant === 'primary' && badge"
      class="ui-button__badge"
      :class="{ 'ui-button__badge--warn': badgeTone === 'warn' }"
    >{{ badge }}</span>
  </button>
</template>

<style scoped>
.ui-button {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-16);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-cond);
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
}

.ui-button__left {
  display: flex;
  align-items: center;
  gap: var(--space-10);
}
.ui-button__label {
  line-height: 1;
}

.ui-button :deep(svg) {
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ─── primary ─── */
.ui-button--primary {
  background: var(--hilite);
  color: var(--ink);
  font-size: var(--text-base); /* 14px */
  justify-content: space-between;
  gap: var(--space-12);
}
.ui-button--primary :deep(svg) {
  width: 16px;
  height: 16px;
  stroke-width: 2.4;
}
/* 4 角 corner bracket */
.ui-button--primary::before,
.ui-button--primary::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--ink);
}
.ui-button--primary::before {
  top: -4px;
  left: -4px;
  border-right: 0;
  border-bottom: 0;
}
.ui-button--primary::after {
  bottom: -4px;
  right: -4px;
  border-left: 0;
  border-top: 0;
}

.ui-button__badge {
  font-family: var(--f-mono);
  font-size: var(--text-xs); /* 10px */
  font-weight: 700;
  letter-spacing: 0.04em;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 3px var(--space-6);
}
.ui-button__badge--warn {
  color: var(--semantic-warning);
}

/* ─── secondary ─── */
.ui-button--secondary {
  background: var(--paper);
  color: var(--ink);
  font-size: 13px;
  justify-content: center;
  gap: var(--space-8);
}
.ui-button--secondary :deep(svg) {
  width: 14px;
  height: 14px;
  stroke-width: 1.8;
}

/* ─── states ─── */
.ui-button:hover:not(.ui-button--disabled) {
  box-shadow: var(--glow-accent-sm);
}
.ui-button:active:not(.ui-button--disabled) {
  transform: translateY(0.5px);
}
.ui-button:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.ui-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
