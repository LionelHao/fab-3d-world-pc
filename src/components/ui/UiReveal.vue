<script setup>
/**
 * UiReveal — 入场动效薄壳（Phase 5 / T5.2）
 *
 * 包 motion-v <Motion>：挂载时 opacity 0→1 + translateY(y→0) 入场，仅播放一次。
 *
 * 决策锚点：
 *   - 动效库 = motion-v（UI_REDESIGN_PLAN.md §1）
 *   - 入场预设 = opacity + translateY(12px)，280ms，easeOutCubic（§2.7）
 *     对齐 tokens.css --duration-base(280ms) / --ease-out-cubic
 *
 * 用法：
 *   <UiReveal><section>…</section></UiReveal>
 *   同屏多段做 stagger 时给递增 delay：
 *   <UiReveal :delay="0">…</UiReveal>
 *   <UiReveal :delay="60">…</UiReveal>
 *   <UiReveal :delay="120">…</UiReveal>
 *   想让薄壳本身就是语义标签（避免多套一层 div）：<UiReveal as="section" …>
 *
 * a11y：prefers-reduced-motion: reduce 时直接渲染裸元素，完全不挂 motion。
 *
 * ⚠️ 两端同源副本：fab-3d-world-web 与 fab-3d-world-pc 各存一份，改动须同步两端。
 */
import { Motion } from 'motion-v'

defineProps({
  /** 渲染的标签名 */
  as: { type: String, default: 'div' },
  /** 入场延迟（ms）— 同屏多段做 stagger 用 */
  delay: { type: Number, default: 0 },
  /** translateY 起始偏移（px） */
  y: { type: Number, default: 12 },
  /** 动效时长（ms）— 默认对齐 --duration-base */
  duration: { type: Number, default: 280 },
})

/** easeOutCubic — 对齐 tokens.css --ease-out-cubic: cubic-bezier(0.33,1,0.68,1) */
const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1]

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <component :is="as" v-if="prefersReducedMotion">
    <slot />
  </component>
  <Motion
    v-else
    :as="as"
    :initial="{ opacity: 0, y }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: duration / 1000, delay: delay / 1000, ease: EASE_OUT_CUBIC }"
  >
    <slot />
  </Motion>
</template>
