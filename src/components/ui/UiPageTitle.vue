<script setup>
/**
 * UiPageTitle — 表单页标题块（.page-title）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #5
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.page-title)
 *
 * h1 大标题 + sub 副标题。sub 为数组，奇数下标段渲染为 accent 高亮。
 *   例 ['FBW IDENTITY · ', 'V3.4'] · ['BOUNTY ID · ', 'BNT-0421', ' · CLASS B']
 */
defineProps({
  title: { type: String, required: true },
  sub: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="ui-page-title">
    <h1 class="ui-page-title__h1">{{ title }}</h1>
    <div v-if="sub.length" class="ui-page-title__sub">
      <span
        v-for="(part, i) in sub"
        :key="i"
        :class="{ 'ui-page-title__accent': i % 2 === 1 }"
      >{{ part }}</span>
    </div>
  </div>
</template>

<style scoped>
.ui-page-title {
  padding-bottom: var(--space-12);
  border-bottom: 1.5px solid var(--ink);
  margin-bottom: var(--space-20);
}

.ui-page-title__h1 {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 26px;
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--ink);
  text-transform: uppercase;
}

.ui-page-title__sub {
  margin-top: var(--space-4);
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-page-title__accent {
  color: var(--accent-link);
  font-weight: 600;
}
</style>
