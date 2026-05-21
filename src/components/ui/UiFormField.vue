<script>
// 模块作用域计数器 — 每个组件实例分配一个稳定唯一 id
let fieldUid = 0
</script>

<script setup>
/**
 * UiFormField — 表单字段包壳（label + 控件 slot + helper）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #2
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.field / .field-lbl / .field-helper)
 *
 * label 行: 文案 + 可选 req `*` + 可选右对齐 hint
 * helper:   控件下方说明，tone='warn' 时砖红橙 + 前置警告图标
 *
 * 用法（label 经 fieldId 与控件关联）:
 *   <UiFormField label="Mobile" required hint="+86 · 11 digits" v-slot="{ fieldId }">
 *     <UiInput :id="fieldId" v-model="phone" />
 *   </UiFormField>
 */
defineProps({
  label: { type: String, default: '' },
  required: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  helper: { type: String, default: '' },
  helperTone: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'warn'].includes(v),
  },
})

const fieldId = `ui-field-${++fieldUid}`
</script>

<template>
  <div class="ui-form-field">
    <label v-if="label" :for="fieldId" class="ui-form-field__label">
      <span>{{ label }}</span>
      <span v-if="required" class="ui-form-field__req" aria-hidden="true">*</span>
      <span v-if="hint" class="ui-form-field__hint">{{ hint }}</span>
    </label>

    <slot :field-id="fieldId" />

    <p
      v-if="helper"
      class="ui-form-field__helper"
      :class="{ 'ui-form-field__helper--warn': helperTone === 'warn' }"
    >
      <svg
        v-if="helperTone === 'warn'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16v0.5" />
      </svg>
      {{ helper }}
    </p>
  </div>
</template>

<style scoped>
.ui-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-14);
}
.ui-form-field:last-child {
  margin-bottom: 0;
}

.ui-form-field__label {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ui-form-field__req {
  color: var(--accent-link);
  font-weight: 700;
  font-size: var(--text-9);
}

.ui-form-field__hint {
  margin-left: auto;
  color: var(--ink-3);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.04em;
}

.ui-form-field__helper {
  margin: var(--space-2) 0 0;
  font-family: var(--f-mono);
  font-size: var(--text-xs); /* 10px */
  color: var(--ink-2);
  letter-spacing: 0.04em;
}

.ui-form-field__helper--warn {
  color: var(--semantic-warning);
  font-weight: 600;
}

.ui-form-field__helper svg {
  width: 10px;
  height: 10px;
  vertical-align: -1px;
  margin-right: var(--space-3);
}
</style>
