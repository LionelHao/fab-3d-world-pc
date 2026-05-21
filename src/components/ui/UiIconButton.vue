<script setup>
/**
 * UiIconButton — 纯 icon 按钮原子组件（PC 版）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.2 (bell 32 / btn-upload 32 / locale 32)
 * Anchor: cd-3-desktop.html bell (line 185-202), bookmark (line 803-814)
 *
 * 与 mobile 版差异:
 *  - PC 不强制 44×44 hit area (鼠标交互不需要)，size 即视觉尺寸 + 实际尺寸 1:1
 *  - 增加 size 20 / 28 (用于 hover-hint / bookmark micro action)
 *
 * 必须覆盖变体:
 *  - 4 variants: ghost / outline / solid / hilite
 *  - 6 sizes: 20 / 24 / 28 / 32 / 38 / 44
 *  - badge: boolean (dot) | number (pip)
 *  - hover / pressed / focus-visible
 */
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, default: 32, validator: (v) => [20, 24, 28, 32, 38, 44].includes(v) },
  variant: { type: String, default: 'outline', validator: (v) => ['ghost', 'outline', 'solid', 'hilite'].includes(v) },
  badge: { type: [Boolean, Number], default: false },
  ariaLabel: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})

defineEmits(['click'])

const showBadge = computed(() => props.badge !== false && props.badge !== null)
const isNumberBadge = computed(() => typeof props.badge === 'number')
</script>

<template>
  <button
    type="button"
    class="ui-iconbutton"
    :class="[
      `ui-iconbutton--${variant}`,
      `ui-iconbutton--size-${size}`,
    ]"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span class="ui-iconbutton__icon">
      <slot />
    </span>
    <span
      v-if="showBadge"
      class="ui-iconbutton__badge"
      :class="{ 'ui-iconbutton__badge--num': isNumberBadge }"
      :aria-hidden="true"
    >
      <span v-if="isNumberBadge">{{ badge > 99 ? '99+' : badge }}</span>
    </span>
  </button>
</template>

<style scoped>
.ui-iconbutton {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  border-radius: var(--radius-none);
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}

.ui-iconbutton:disabled { opacity: 0.4; cursor: not-allowed; }

.ui-iconbutton__icon { display: inline-flex; align-items: center; justify-content: center; }

.ui-iconbutton--size-20 { width: 20px; height: 20px; }
.ui-iconbutton--size-20 .ui-iconbutton__icon { width: 14px; height: 14px; }
.ui-iconbutton--size-24 { width: 24px; height: 24px; }
.ui-iconbutton--size-24 .ui-iconbutton__icon { width: 14px; height: 14px; }
.ui-iconbutton--size-28 { width: 28px; height: 28px; }
.ui-iconbutton--size-28 .ui-iconbutton__icon { width: 16px; height: 16px; }
.ui-iconbutton--size-32 { width: 32px; height: 32px; }
.ui-iconbutton--size-32 .ui-iconbutton__icon { width: 16px; height: 16px; }
.ui-iconbutton--size-38 { width: 38px; height: 38px; }
.ui-iconbutton--size-38 .ui-iconbutton__icon { width: 20px; height: 20px; }
.ui-iconbutton--size-44 { width: 44px; height: 44px; }
.ui-iconbutton--size-44 .ui-iconbutton__icon { width: 22px; height: 22px; }

.ui-iconbutton--ghost { background: transparent; color: var(--ink); }
.ui-iconbutton--ghost:hover:not(:disabled) { background: var(--paper-3); }
.ui-iconbutton--ghost:active:not(:disabled) { background: var(--paper-3); }

.ui-iconbutton--outline {
  background: var(--paper);
  color: var(--ink);
  box-shadow: inset 0 0 0 1.5px var(--ink);
}
.ui-iconbutton--outline:hover:not(:disabled) { background: var(--paper-3); }
.ui-iconbutton--outline:active:not(:disabled) { background: var(--paper-3); }

.ui-iconbutton--solid { background: var(--ink); color: var(--paper); }
.ui-iconbutton--solid:hover:not(:disabled) { background: var(--accent-link); }
.ui-iconbutton--solid:active:not(:disabled) { background: var(--accent-link); }

.ui-iconbutton--hilite { background: var(--ink); color: var(--hilite); }
.ui-iconbutton--hilite:hover:not(:disabled) { background: var(--accent-link); color: var(--paper); }
.ui-iconbutton--hilite:active:not(:disabled) { background: var(--accent-link); color: var(--paper); }

.ui-iconbutton:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.ui-iconbutton--outline:focus-visible { box-shadow: inset 0 0 0 1.5px var(--ink), var(--glow-accent-ring); }

.ui-iconbutton__badge {
  position: absolute;
  top: -3px; right: -3px;
  width: 8px; height: 8px;
  background: var(--semantic-warning);
  border: 1.5px solid var(--paper);
  border-radius: var(--radius-full);
  pointer-events: none;
}

.ui-iconbutton__badge--num {
  width: auto;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  background: var(--hilite);
  border: 1.5px solid var(--ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  top: -8px;
  right: -8px;
}

.ui-iconbutton--solid .ui-iconbutton__badge:not(.ui-iconbutton__badge--num),
.ui-iconbutton--hilite .ui-iconbutton__badge:not(.ui-iconbutton__badge--num) {
  border-color: var(--ink);
}
</style>
