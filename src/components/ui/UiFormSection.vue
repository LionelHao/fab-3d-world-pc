<script setup>
/**
 * UiFormSection — 表单分节（.sec + .sec-hd）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #6
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.sec / .sec-hd)
 *
 * 顶 1.5px ink 分隔线 + 节头(num accent + name ink + stamp 标签) + 内容 slot。
 */
defineProps({
  num: { type: String, default: '' },
  name: { type: String, required: true },
  stamp: { type: String, default: '' },
  stampTone: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'warn', 'hilite'].includes(v),
  },
})
</script>

<template>
  <section class="ui-form-section">
    <div class="ui-form-section__hd">
      <div class="ui-form-section__left">
        <span v-if="num" class="ui-form-section__num">{{ num }}</span>
        <span class="ui-form-section__name">{{ name }}</span>
      </div>
      <span
        v-if="stamp"
        class="ui-form-section__stamp"
        :class="`ui-form-section__stamp--${stampTone}`"
      >{{ stamp }}</span>
    </div>
    <slot />
  </section>
</template>

<style scoped>
.ui-form-section {
  border-top: 1.5px solid var(--ink);
  padding-top: var(--space-10);
  margin-bottom: var(--space-20);
}

.ui-form-section__hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-12);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-form-section__left {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}
.ui-form-section__num {
  color: var(--accent-link);
}
.ui-form-section__name {
  color: var(--ink);
}

.ui-form-section__stamp {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 2px 5px;
  border: 1px solid var(--ink-2);
  color: var(--ink-2);
}
.ui-form-section__stamp--warn {
  color: var(--semantic-warning);
  border-color: var(--semantic-warning);
}
.ui-form-section__stamp--hilite {
  color: var(--ink);
  background: var(--hilite);
  border-color: var(--ink);
}
</style>
