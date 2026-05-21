<script setup>
/**
 * PcCtaStack — PC detail 右栏 CTA 垂直组
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3 (B3R-3)
 * Anchor: cd-4-desktop.html line 1504-1517 (.cta-stack)
 *
 * 结构:
 *  - btn-primary (hilite bg + 4 corner brackets + left icon + label + .size badge 右下)
 *  - btn-secondary (paper outline + left icon + label)
 */
defineProps({
  primaryLabel: { type: String, required: true },
  primaryMeta: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
  secondaryAriaLabel: { type: String, default: '' },
})

defineEmits(['primary-click', 'secondary-click'])
</script>

<template>
  <div class="pc-cta-stack">
    <button
      type="button"
      class="pc-cta-stack__primary"
      @click="$emit('primary-click', $event)"
    >
      <span class="pc-cta-stack__primary-left">
        <span class="pc-cta-stack__primary-icon">
          <slot name="primary-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" />
            </svg>
          </slot>
        </span>
        <span class="pc-cta-stack__primary-label">{{ primaryLabel }}</span>
      </span>
      <span v-if="primaryMeta" class="pc-cta-stack__primary-meta">{{ primaryMeta }}</span>
    </button>

    <button
      v-if="secondaryLabel || $slots['secondary-icon'] || secondaryAriaLabel"
      type="button"
      class="pc-cta-stack__secondary"
      :aria-label="secondaryAriaLabel || secondaryLabel"
      @click="$emit('secondary-click', $event)"
    >
      <span class="pc-cta-stack__secondary-icon">
        <slot name="secondary-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 9V4h10v5" />
            <rect x="4" y="9" width="16" height="8" rx="1.5" />
            <path d="M7 17v3h10v-3" />
            <circle cx="17" cy="13" r="1" fill="currentColor" />
          </svg>
        </slot>
      </span>
      <span v-if="secondaryLabel" class="pc-cta-stack__secondary-label">{{ secondaryLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.pc-cta-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

/* ===== Primary ===== */
.pc-cta-stack__primary {
  position: relative;
  height: 56px;
  background: var(--hilite);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-cta-stack__primary::before,
.pc-cta-stack__primary::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--ink);
  pointer-events: none;
}
.pc-cta-stack__primary::before {
  top: -4px;
  left: -4px;
  border-right: 0;
  border-bottom: 0;
}
.pc-cta-stack__primary::after {
  bottom: -4px;
  right: -4px;
  border-left: 0;
  border-top: 0;
}
.pc-cta-stack__primary:hover {
  box-shadow: var(--glow-accent-md);
}
.pc-cta-stack__primary:active {
  transform: translateY(1px);
}
.pc-cta-stack__primary:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.pc-cta-stack__primary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pc-cta-stack__primary-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}
.pc-cta-stack__primary-icon :deep(svg) {
  width: 20px;
  height: 20px;
}
.pc-cta-stack__primary-meta {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 3px 8px;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

/* ===== Secondary ===== */
.pc-cta-stack__secondary {
  height: 48px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 14px;
  cursor: pointer;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out, transform 120ms ease-out;
}
.pc-cta-stack__secondary-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}
.pc-cta-stack__secondary-icon :deep(svg) {
  width: 20px;
  height: 20px;
}
.pc-cta-stack__secondary:hover {
  background: var(--paper-3);
  box-shadow: var(--glow-accent-sm);
}
.pc-cta-stack__secondary:active {
  transform: translateY(1px);
}
.pc-cta-stack__secondary:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
</style>
