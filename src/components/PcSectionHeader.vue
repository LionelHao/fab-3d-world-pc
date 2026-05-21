<script setup>
/**
 * PcSectionHeader — 各 section 通用标题栏 (§ 01 / § 02 / § 03)
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.5.1
 * Anchor: cd-3-desktop.html line 649-710
 */
defineProps({
  num: { type: String, required: true },
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  cta: { type: String, default: 'Browse all' },
})

defineEmits(['cta-click'])
</script>

<template>
  <div class="pc-sechd-wrap">
    <div class="pc-sechd">
      <div class="pc-sechd__left">
        <span class="pc-sechd__num">{{ num }}</span>
        <h2 class="pc-sechd__title">{{ title }}</h2>
        <span v-if="sub" class="pc-sechd__sub">{{ sub }}</span>
      </div>
      <button
        v-if="cta"
        type="button"
        class="pc-sechd__cta"
        @click="$emit('cta-click', $event)"
      >
        {{ cta }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </button>
    </div>
    <div class="pc-sechd__rule" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.pc-sechd-wrap { width: 100%; }
.pc-sechd {
  width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}
.pc-sechd__left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.pc-sechd__num {
  font-family: var(--f-mono);
  font-size: 13px;
  color: var(--accent-link);
  font-weight: 700;
  letter-spacing: 0.08em;
}
.pc-sechd__title {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 36px;
  letter-spacing: -0.015em;
  color: var(--ink);
  text-transform: uppercase;
  line-height: 1;
}
.pc-sechd__sub {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: 8px;
}
.pc-sechd__cta {
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 11px;
  color: var(--ink);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: var(--radius-none);
  cursor: pointer;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-sechd__cta:hover { background: var(--paper-3); box-shadow: var(--glow-accent-sm); }
.pc-sechd__cta:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-sechd__cta svg { width: 12px; height: 12px; }

.pc-sechd__rule {
  width: 1280px;
  margin: 0 auto 32px;
  border-top: 1.5px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  height: 4px;
}
</style>
