<script setup>
/**
 * PcRelatedCard — PC § 04 Related Specimens 卡片
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3 (B3R-8)
 * Anchor: cd-4-desktop.html line 1616-1693 (.rcard)
 *
 * 结构:
 *  - rhead (ink 反色头, "SAMPLE · <b>2455</b>")
 *  - rthumb (相对定位 + 2 corner 装饰角 + default slot 接 SVG art)
 *  - rbody (h4 标题 + rstats ♡ likes / price)
 */
defineProps({
  sampleId: { type: String, required: true },
  title: { type: String, required: true },
  likes: { type: String, default: '' }, // pre-formatted, e.g. '12.4k'
  price: { type: String, default: '' }, // 'Free' or '$2.49'
})

defineEmits(['click'])
</script>

<template>
  <article
    class="pc-related-card"
    role="link"
    tabindex="0"
    @click="$emit('click', $event)"
    @keydown.enter="$emit('click', $event)"
    @keydown.space.prevent="$emit('click', $event)"
  >
    <div class="pc-related-card__head">
      SAMPLE · <b>{{ sampleId }}</b>
    </div>
    <div class="pc-related-card__thumb">
      <span class="pc-related-card__corner pc-related-card__corner--tl" aria-hidden="true" />
      <span class="pc-related-card__corner pc-related-card__corner--br" aria-hidden="true" />
      <slot />
    </div>
    <div class="pc-related-card__body">
      <h4 class="pc-related-card__title">{{ title }}</h4>
      <div class="pc-related-card__stats">
        <span v-if="likes" class="pc-related-card__likes">♡ {{ likes }}</span>
        <span v-if="price" class="pc-related-card__price">{{ price }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pc-related-card {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-related-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-accent-sm);
}
.pc-related-card:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.pc-related-card__head {
  background: var(--ink);
  color: var(--paper);
  padding: 6px 10px;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-related-card__head b {
  color: var(--hilite);
  font-weight: 700;
}

.pc-related-card__thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--paper-2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pc-related-card__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--accent-link);
  pointer-events: none;
}
.pc-related-card__corner--tl {
  top: 8px;
  left: 8px;
  border-right: 0;
  border-bottom: 0;
}
.pc-related-card__corner--br {
  bottom: 8px;
  right: 8px;
  border-left: 0;
  border-top: 0;
}

.pc-related-card__thumb :deep(svg) {
  width: 80%;
  height: 80%;
  display: block;
}

.pc-related-card__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--ink-2);
}

.pc-related-card__title {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-14);
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
}

.pc-related-card__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pc-related-card__likes {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 500;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.pc-related-card__price {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 700;
  color: var(--accent-link);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
