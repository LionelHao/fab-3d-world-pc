<script setup>
/**
 * PcSubSection — 内容子分节外壳（cd-8 .sub-sec + .sub-head）
 *
 * Spec: docs/design/specs/p3.10-profile.md §3.C #2
 * Anchor: cd-8-desktop-profile.html line 472-502 (.sub-sec / .sub-head)
 *
 * paper 卡 + ink 头条（num hilite + name paper + stamp）+ 内容 slot。
 * §01.1-§01.4 四段共用。
 */
defineProps({
  num: { type: String, default: '' },
  name: { type: String, required: true },
  stamp: { type: String, default: '' },
  /** hilite: 实底徽标；dim: 描边徽标 */
  stampTone: {
    type: String,
    default: 'hilite',
    validator: (v) => ['hilite', 'dim'].includes(v),
  },
})
</script>

<template>
  <section class="pc-sub-section">
    <div class="pc-sub-section__head">
      <div class="pc-sub-section__left">
        <span v-if="num" class="pc-sub-section__num">{{ num }}</span>
        <span class="pc-sub-section__name">{{ name }}</span>
      </div>
      <span
        v-if="stamp"
        class="pc-sub-section__stamp"
        :class="`pc-sub-section__stamp--${stampTone}`"
      >{{ stamp }}</span>
    </div>
    <slot />
  </section>
</template>

<style scoped>
.pc-sub-section {
  background: var(--paper);
  border: 1.5px solid var(--ink);
}

.pc-sub-section__head {
  background: var(--ink);
  color: var(--paper);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.pc-sub-section__left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.pc-sub-section__num {
  color: var(--hilite);
  font-weight: 600;
}
.pc-sub-section__name {
  color: var(--paper);
  font-weight: 600;
}

.pc-sub-section__stamp {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 6px;
  flex-shrink: 0;
}
.pc-sub-section__stamp--hilite {
  background: var(--hilite);
  color: var(--ink);
  font-weight: 700;
}
.pc-sub-section__stamp--dim {
  background: transparent;
  color: var(--paper);
  border: 1px solid var(--ink-3);
  font-weight: 500;
}
</style>
