<script setup>
/**
 * PcMakerCard — TOP MAKERS 单卡
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.6
 * Anchor: cd-3-desktop.html line 1977-2036 + CSS line 926-1042
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiAvatar from '@/components/ui/UiAvatar.vue'

const { t } = useI18n()

const props = defineProps({
  maker: { type: Object, required: true },
})

const emit = defineEmits(['follow-toggle', 'click'])

const rankLabel = computed(() => `№ ${String(props.maker.rank).padStart(2, '0')} · ${props.maker.opId}`)
const followLabel = computed(() => (props.maker.following ? t('home.maker.followingBtn') : t('home.maker.followBtn')))

const onFollow = (e) => {
  e.stopPropagation()
  emit('follow-toggle', !props.maker.following)
}
</script>

<template>
  <div class="pc-maker" :class="{ 'pc-maker--following': maker.following }" @click="$emit('click', maker)">
    <header class="pc-maker__head">
      <span>{{ t('home.maker.rankLabel') }}</span>
      <span class="pc-maker__id">{{ rankLabel }}</span>
    </header>
    <div class="pc-maker__body">
      <UiAvatar
        :initials="maker.initials"
        :size="80"
        :palette="maker.avatarBg === 'hilite' ? 'hilite' : maker.avatarBg === 'ink' ? 'ink' : maker.avatarBg === 'paper-3' ? 'paper-3' : maker.avatarInk === 'accent' ? 'accent' : 'default'"
        shape="square"
      />
      <span class="pc-maker__handle">
        {{ maker.handle }}
        <span v-if="maker.badge" class="pc-maker__badge">{{ maker.badge }}</span>
      </span>
      <div class="pc-maker__stats">
        <div class="pc-maker__cell">
          <span class="pc-maker__k">{{ t('home.maker.follLabel') }}</span>
          <span class="pc-maker__v">{{ maker.stats.foll }}</span>
        </div>
        <div class="pc-maker__cell">
          <span class="pc-maker__k">{{ t('home.maker.modelsLabel') }}</span>
          <span class="pc-maker__v">{{ maker.stats.models }}</span>
        </div>
      </div>
      <button class="pc-maker__follow" type="button" @click="onFollow">{{ followLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.pc-maker {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out;
}
.pc-maker:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-accent-sm);
}

.pc-maker__head {
  background: var(--ink);
  color: var(--paper);
  height: 24px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.pc-maker__id { color: var(--hilite); font-weight: 600; }

.pc-maker__body {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
}
.pc-maker__body::before,
.pc-maker__body::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--accent-link);
}
.pc-maker__body::before { top: 12px; left: 12px; border-right: 0; border-bottom: 0; }
.pc-maker__body::after  { bottom: 12px; right: 12px; border-left: 0; border-top: 0; }

.pc-maker__handle {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  font-weight: 600;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 8px;
}
.pc-maker__badge {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--accent-link);
  color: var(--paper);
  padding: 2px 6px;
}

.pc-maker__stats {
  display: flex;
  justify-content: space-around;
  width: 100%;
  gap: 8px;
  border-top: 1px solid var(--paper-3);
  border-bottom: 1px solid var(--paper-3);
  padding: 10px 0;
}
.pc-maker__cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pc-maker__k {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
}
.pc-maker__v {
  font-family: var(--f-mono);
  font-size: var(--text-18);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.pc-maker__follow {
  width: 100%;
  height: 32px;
  background: var(--paper);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-11);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-maker__follow:hover { background: var(--paper-3); }
.pc-maker__follow:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

.pc-maker--following .pc-maker__follow {
  background: var(--ink);
  color: var(--paper);
}
.pc-maker--following .pc-maker__follow:hover { background: var(--accent-link); }
</style>
