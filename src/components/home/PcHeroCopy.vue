<script setup>
/**
 * PcHeroCopy — HERO 右半 editorial copy
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.4.2
 * Anchor: cd-3-desktop.html line 1543-1595 + CSS line 459-547
 */
import { useI18n } from 'vue-i18n'
import UiAvatar from '@/components/ui/UiAvatar.vue'

const { t, tm } = useI18n()

defineProps({
  hero: { type: Object, required: true }, // heroFixture
})

defineEmits(['download-click', 'studio-click'])

const splitTitle = (title) => {
  // 简单解析: 把版本号前的字串切出
  const m = title.match(/^(.+?)\s+(V\d+(?:\.\d+)?)$/i)
  if (!m) return { name: title, ver: '', verNum: '' }
  const ver = m[2]
  const vm = ver.match(/^(V\d+)(?:\.(\d+))?$/i)
  if (!vm) return { name: m[1], ver, verNum: '' }
  return { name: m[1], ver: vm[1], verNum: vm[2] ? `.${vm[2]}` : '' }
}

function formatStat(n) {
  if (n == null) return '0'
  return n.toLocaleString('en-US')
}
</script>

<template>
  <div class="pc-hero-copy">
    <div>
      <span class="pc-hero-copy__eyebrow">{{ hero.eyebrow }}</span>
      <h1 class="pc-hero-copy__title">
        <template v-for="(line, i) in splitTitle(hero.title).name.split(' ')" :key="i">
          {{ line }}<br/>
        </template>
        <span class="pc-hero-copy__ver">{{ splitTitle(hero.title).ver }}</span><span class="pc-hero-copy__ver-num">{{ splitTitle(hero.title).verNum }}</span>
      </h1>

      <div class="pc-hero-copy__author">
        <div class="pc-hero-copy__chip">
          <UiAvatar
            :initials="hero.author.initials"
            :size="26"
            palette="hilite"
            shape="square"
            class="pc-hero-copy__avatar"
          />
          <span class="pc-hero-copy__handle">{{ hero.author.handle }}</span>
          <span v-if="hero.author.badge" class="pc-hero-copy__maker">{{ hero.author.badge }}</span>
        </div>
        <div class="pc-hero-copy__stats">
          <span>♡ <b>{{ formatStat(hero.stats.likes) }}</b></span>
          <span class="pc-hero-copy__sep">·</span>
          <span>↓ <b>{{ formatStat(hero.stats.downloads) }}</b></span>
          <span class="pc-hero-copy__sep">·</span>
          <span><b>{{ formatStat(hero.stats.prints) }}</b> {{ t('home.hero.statsPrintsLabel') }}</span>
        </div>
      </div>

      <div class="pc-hero-copy__body">
        <p v-for="(p, i) in tm('home.hero.body')" :key="i">{{ p }}</p>
      </div>
    </div>

    <div class="pc-hero-copy__cta">
      <button class="pc-hero-copy__btn-primary" type="button" @click="$emit('download-click')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/>
        </svg>
        {{ t('home.hero.ctaDownload') }}
        <span class="pc-hero-copy__size">{{ hero.cta.primary.size }}</span>
      </button>
      <button class="pc-hero-copy__btn-secondary" type="button" @click="$emit('studio-click')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9"/>
          <path d="M3 6V3h3"/>
        </svg>
        {{ t('home.hero.ctaStudio') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pc-hero-copy {
  padding: 16px 0 16px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.pc-hero-copy__eyebrow {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 700;
  color: var(--ink);
  background: var(--hilite);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin-bottom: 24px;
}
.pc-hero-copy__eyebrow::before {
  content: "";
  width: 6px;
  height: 6px;
  background: var(--ink);
  display: inline-block;
}

.pc-hero-copy__title {
  margin: 0 0 24px;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-88);
  line-height: 0.92;
  letter-spacing: -0.025em;
  color: var(--ink);
  text-transform: uppercase;
}
.pc-hero-copy__ver { color: var(--accent-link); }
.pc-hero-copy__ver-num {
  font-family: var(--f-mono);
  font-size: var(--text-36);
  font-weight: 700;
  letter-spacing: 0;
  vertical-align: super;
  color: var(--accent-link);
  margin-left: 6px;
}

.pc-hero-copy__author {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.pc-hero-copy__chip {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pc-hero-copy__handle {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  font-weight: 600;
  color: var(--ink);
}
.pc-hero-copy__maker {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--accent-link);
  color: var(--paper);
  padding: 2px 6px;
}

.pc-hero-copy__stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.pc-hero-copy__stats b { color: var(--ink); font-weight: 600; }
.pc-hero-copy__sep { color: var(--ink-3); }

.pc-hero-copy__body {
  font-family: var(--f-sans);
  font-size: var(--text-16);
  color: var(--ink-2);
  line-height: 1.55;
  max-width: 460px;
}
.pc-hero-copy__body p { margin: 0 0 12px; }
.pc-hero-copy__body :deep(b) { color: var(--ink); font-weight: 600; }

.pc-hero-copy__cta { display: flex; gap: 12px; margin-top: 24px; }

.pc-hero-copy__btn-primary {
  height: 48px;
  padding: 0 18px;
  background: var(--ink);
  color: var(--hilite);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-16);
  letter-spacing: 0;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-hero-copy__btn-primary svg { width: 16px; height: 16px; }
.pc-hero-copy__btn-primary .pc-hero-copy__size,
.pc-hero-copy__size {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 500;
  letter-spacing: 0.06em;
  opacity: 0.7;
}
.pc-hero-copy__btn-primary::before,
.pc-hero-copy__btn-primary::after {
  content: "";
  position: absolute;
  width: 6px; height: 6px;
  border: 1.5px solid var(--hilite);
}
.pc-hero-copy__btn-primary::before { top: -4px; left: -4px; border-right: 0; border-bottom: 0; }
.pc-hero-copy__btn-primary::after  { bottom: -4px; right: -4px; border-left: 0; border-top: 0; }
.pc-hero-copy__btn-primary:hover { background: var(--accent-link); }
.pc-hero-copy__btn-primary:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

.pc-hero-copy__btn-secondary {
  height: 48px;
  padding: 0 18px;
  background: var(--paper);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-16);
  letter-spacing: 0;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-hero-copy__btn-secondary svg { width: 16px; height: 16px; }
.pc-hero-copy__btn-secondary:hover { background: var(--paper-3); }
.pc-hero-copy__btn-secondary:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
