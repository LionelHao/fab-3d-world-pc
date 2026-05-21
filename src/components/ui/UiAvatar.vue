<script setup>
/**
 * UiAvatar — 头像原子组件（PC 版）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.2 (avatar-32 nav), §1.4.2 (author-chip 26), §1.6 (maker 80)
 * Anchor: cd-3-desktop.html line 226-232 (nav avatar), 467-472 (hero author), 964-973 (maker)
 *
 * 与 mobile 版差异:
 *  - 增加 size 26 / 80 (hero author chip / maker leaderboard)
 *  - 增加 palette prop 控制 bg + text 色组合 (maker 5 卡 4 套配色)
 *  - 沿用 mobile 的 fallback initials 派生算法
 *
 * 必须覆盖变体:
 *  - 有 src 加载成功 / 失败 → fallback initials
 *  - 仅 initials 无 src
 *  - 3 种 shape: square (默认) / rounded / circle
 *  - 7 种 size: 20/22/24/26/32/40/56/80
 *  - 5 种 palette: default / hilite / ink / paper-3 / accent
 *  - ring on/off (1px accent 外环)
 */
import { ref, computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  initials: { type: String, default: '' },
  size: { type: Number, default: 32, validator: (v) => [20, 22, 24, 26, 32, 40, 56, 80].includes(v) },
  shape: { type: String, default: 'square', validator: (v) => ['square', 'rounded', 'circle'].includes(v) },
  ring: { type: Boolean, default: false },
  /** 配色组合（仅在 initials 渲染时生效） */
  palette: { type: String, default: 'default', validator: (v) => ['default', 'hilite', 'ink', 'paper-3', 'accent'].includes(v) },
  ariaLabel: { type: String, default: '' },
})

const imgFailed = ref(false)
const onImgError = () => { imgFailed.value = true }

const computedInitials = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase()
  if (!props.name) return '?'
  const cleaned = props.name.replace(/[@_\-\s.]+/g, '')
  if (/^[A-Za-z]/.test(cleaned)) {
    const parts = props.name.replace(/^@/, '').split(/[\s.\-_]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return cleaned.slice(0, 2).toUpperCase()
  }
  return cleaned.slice(0, 1)
})

const showImage = computed(() => !!props.src && !imgFailed.value)
const ariaLabelFinal = computed(() => props.ariaLabel || props.name || 'Avatar')
</script>

<template>
  <span
    class="ui-avatar"
    :class="[
      `ui-avatar--size-${size}`,
      `ui-avatar--shape-${shape}`,
      !showImage && `ui-avatar--palette-${palette}`,
      { 'ui-avatar--ring': ring },
    ]"
    role="img"
    :aria-label="ariaLabelFinal"
  >
    <img v-if="showImage" :src="src" :alt="ariaLabelFinal" @error="onImgError" />
    <span v-else class="ui-avatar__initials">{{ computedInitials }}</span>
  </span>
</template>

<style scoped>
.ui-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--paper-2);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  flex-shrink: 0;
  font-family: var(--f-mono);
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.ui-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ui-avatar__initials { user-select: none; }

.ui-avatar--size-20 { width: 20px; height: 20px; }
.ui-avatar--size-20 .ui-avatar__initials { font-size: var(--text-9); }
.ui-avatar--size-22 { width: 22px; height: 22px; }
.ui-avatar--size-22 .ui-avatar__initials { font-size: var(--text-11); }
.ui-avatar--size-24 { width: 24px; height: 24px; }
.ui-avatar--size-24 .ui-avatar__initials { font-size: var(--text-12); }
.ui-avatar--size-26 { width: 26px; height: 26px; }
.ui-avatar--size-26 .ui-avatar__initials { font-size: var(--text-12); }
.ui-avatar--size-32 { width: 32px; height: 32px; }
.ui-avatar--size-32 .ui-avatar__initials { font-size: var(--text-14); }
.ui-avatar--size-40 { width: 40px; height: 40px; }
.ui-avatar--size-40 .ui-avatar__initials { font-size: var(--text-16); }
.ui-avatar--size-56 { width: 56px; height: 56px; }
.ui-avatar--size-56 .ui-avatar__initials { font-size: var(--text-22); }
.ui-avatar--size-80 { width: 80px; height: 80px; }
.ui-avatar--size-80 .ui-avatar__initials { font-size: var(--text-32); }

.ui-avatar--shape-square { border-radius: var(--radius-none); }
.ui-avatar--shape-rounded { border-radius: var(--radius-sm); }
.ui-avatar--shape-circle { border-radius: var(--radius-full); }

.ui-avatar--ring {
  outline: 1px solid var(--accent-link);
  outline-offset: 2px;
}

/* palette — bg + text 配色组合 (仅在 initials fallback 时生效) */
.ui-avatar--palette-default  { background: var(--paper-2); color: var(--ink); }
.ui-avatar--palette-hilite   { background: var(--hilite);  color: var(--ink); }
.ui-avatar--palette-ink      { background: var(--ink);     color: var(--hilite); }
.ui-avatar--palette-paper-3  { background: var(--paper-3); color: var(--ink); }
.ui-avatar--palette-accent   { background: var(--paper-2); color: var(--accent-link); }
</style>
