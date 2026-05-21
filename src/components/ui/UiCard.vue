<script setup>
/**
 * UiCard — 主信息卡片原子组件（PC 版，1:1 复刻 cd-3 desktop grid card 元素密度）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.5.3 (card grid)
 * Anchor: cd-3-desktop.html line 757-916 (.card)
 *
 * 与 mobile 版差异:
 *  - 单一 variant 聚焦 grid card; hero 在 PC 用 PcHeroPlate + PcHeroCopy 独立组件
 *  - 增加 bookmark toggle 按钮（cd-3 .bookmark + .bookmark.on）
 *  - 增加 hover-hint "⌥ ⇧ Preview · Drag to orbit"（hover 显现）
 *  - 增加 scale-mini 底部 5cm 刻度
 *  - thumb 4 角 corners + card-head 共用 ink bar
 *
 * 元素密度: 与 cd-3 卡片 1:1 — card-head / 4 corners / bookmark / hover-hint /
 * thumb svg / scale-mini / title (h3) / by (@handle) / specs / price + stats row
 */
import { computed } from 'vue'

const props = defineProps({
  sampleCode: { type: String, default: '' },

  coverUrl: { type: String, default: '' },
  scaleLabel: { type: String, default: '5cm' },
  showScale: { type: Boolean, default: true },
  hoverHint: { type: String, default: '⌥ ⇧ Preview · Drag to orbit' },

  title: { type: String, required: true },

  author: {
    type: Object,
    default: () => ({ handle: '' }),
  },

  specs: {
    type: Object,
    default: () => ({ dim: '', mass: '', time: '' }),
  },

  price: {
    type: Object,
    default: () => ({ label: 'Free', paid: false }),
  },

  stats: {
    type: Object,
    default: () => ({ likes: 0, downloads: 0 }),
  },

  bookmarked: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'bookmark-toggle'])

const formatNumber = (n) => {
  if (n == null) return '0'
  if (n >= 1000) {
    const k = (n / 1000).toFixed(n >= 10000 ? 0 : 1)
    return `${k.replace(/\.0$/, '')}k`
  }
  return String(n)
}

const likesText = computed(() => formatNumber(props.stats?.likes))
const downloadsText = computed(() => formatNumber(props.stats?.downloads))

const specsLine = computed(() => {
  const parts = []
  if (props.specs?.dim)  parts.push(`DIM <b>${props.specs.dim}</b>`)
  if (props.specs?.mass) parts.push(`MASS <b>${props.specs.mass}</b>`)
  if (props.specs?.time) parts.push(`T <b>${props.specs.time}</b>`)
  return parts.join(' · ')
})

const onCardClick = (e) => emit('click', e)
const onBookmark = (e) => {
  e.stopPropagation()
  emit('bookmark-toggle', !props.bookmarked)
}
</script>

<template>
  <article class="ui-card" @click="onCardClick">
    <header class="ui-card__head">
      <span>SAMPLE</span>
      <span class="ui-card__id">{{ sampleCode }}</span>
    </header>

    <div class="ui-card__thumb">
      <span class="ui-card__corner ui-card__corner--tl"></span>
      <span class="ui-card__corner ui-card__corner--tr"></span>
      <span class="ui-card__corner ui-card__corner--bl"></span>
      <span class="ui-card__corner ui-card__corner--br"></span>

      <button
        type="button"
        class="ui-card__bookmark"
        :class="{ 'ui-card__bookmark--on': bookmarked }"
        :aria-label="bookmarked ? 'Saved' : 'Save'"
        :aria-pressed="bookmarked"
        @click="onBookmark"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" :fill="bookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path d="M6 3h12v18l-6-4-6 4z"/>
        </svg>
      </button>

      <span v-if="hoverHint" class="ui-card__hint">{{ hoverHint }}</span>

      <slot name="thumb">
        <img v-if="coverUrl" class="ui-card__cover" :src="coverUrl" :alt="title" />
      </slot>

      <div v-if="showScale" class="ui-card__scale" aria-hidden="true">
        <span class="tick long"></span>
        <span class="tick"></span><span class="tick"></span><span class="tick"></span><span class="tick"></span>
        <span class="tick long"></span>
        <span class="ui-card__scale-label">{{ scaleLabel }}</span>
      </div>
    </div>

    <div class="ui-card__body">
      <h3 class="ui-card__title">{{ title }}</h3>
      <span v-if="author?.handle" class="ui-card__by">
        <em>BY</em>{{ author.handle }}
      </span>
      <div v-if="specsLine" class="ui-card__specs" v-html="specsLine"></div>
      <div class="ui-card__row">
        <span class="ui-card__price" :class="{ 'ui-card__price--paid': price.paid }">
          {{ price.label }}
        </span>
        <span class="ui-card__stats">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>
            </svg>
            {{ likesText }}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/>
            </svg>
            {{ downloadsText }}
          </span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ui-card {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out;
}

.ui-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-accent-sm);
}

.ui-card:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

/* head */
.ui-card__head {
  background: var(--ink);
  color: var(--paper);
  padding: 5px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-card__id {
  color: var(--hilite);
  font-weight: 600;
}

/* thumb */
.ui-card__thumb {
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
}

.ui-card__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--accent-link);
  pointer-events: none;
  z-index: 2;
}
.ui-card__corner--tl { top: 8px; left: 8px;   border-right: 0; border-bottom: 0; }
.ui-card__corner--tr { top: 8px; right: 8px;  border-left: 0;  border-bottom: 0; }
.ui-card__corner--bl { bottom: 8px; left: 8px; border-right: 0; border-top: 0; }
.ui-card__corner--br { bottom: 8px; right: 8px; border-left: 0; border-top: 0; }

.ui-card__bookmark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  cursor: pointer;
  z-index: 4;
  padding: 0;
  transition: background-color 120ms ease-out;
}
.ui-card__bookmark:hover { background: var(--paper-3); }
.ui-card__bookmark--on { background: var(--hilite); }
.ui-card__bookmark:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.ui-card__hint {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 3px 6px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
  z-index: 4;
  font-weight: 600;
  pointer-events: none;
}

.ui-card:hover .ui-card__hint {
  opacity: 1;
  transform: translateY(0);
}

.ui-card__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* Phase 4 T4.5: 卡片封面 3D 感反馈 */
  transition: transform 240ms cubic-bezier(0.2, 0, 0.2, 1);
}
.ui-card:hover .ui-card__cover {
  transform: scale(1.05);
}

.ui-card__scale {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  font-family: var(--f-mono);
  font-size: 7.5px;
  color: var(--ink-2);
  pointer-events: none;
  z-index: 2;
}
.ui-card__scale .tick { width: 1px; height: 4px; background: var(--ink-2); margin-right: 6px; }
.ui-card__scale .tick.long { height: 6px; background: var(--ink); }
.ui-card__scale-label { margin-left: 4px; transform: translateY(-1px); }

/* body */
.ui-card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-card__title {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-16);
  line-height: 1.15;
  letter-spacing: -0.005em;
  color: var(--ink);
  text-transform: uppercase;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.15em * 2);
}

.ui-card__by {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-2);
  letter-spacing: 0.02em;
}
.ui-card__by em {
  font-style: normal;
  color: var(--ink-3);
  margin-right: 4px;
}

.ui-card__specs {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  line-height: 1.5;
  background: var(--paper-2);
  border: 1px solid var(--ink-2);
  padding: 6px 8px;
  font-variant-numeric: tabular-nums;
}
.ui-card__specs :deep(b) { color: var(--ink); font-weight: 600; }

.ui-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ui-card__price {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--hilite);
  padding: 3px 8px;
}
.ui-card__price--paid {
  background: var(--paper);
  border: 1px solid var(--ink);
}

.ui-card__stats {
  display: flex;
  gap: 10px;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.ui-card__stats span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ui-card__stats svg {
  width: 11px;
  height: 11px;
  color: var(--ink-3);
}
</style>
