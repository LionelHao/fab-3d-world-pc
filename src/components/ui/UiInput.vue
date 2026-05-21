<script setup>
/**
 * UiInput — 表单文本输入（.input-wrap）
 *
 * Spec: docs/design/specs/p3.8-forms.md §3.B #3
 * Anchor: docs/design/inspiration/cd-5-mobile-form.html (.input-wrap)
 *
 * 槽位组合（左 → 右）: prefix(ink 段) · input · [ibtn slot] · countdown · suffix(paper-3 段)
 * 状态: default / focus(双环 hilite) / error(warn 边框 + 左色条)
 */
defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  /** 与 UiFormField fieldId 关联 */
  id: { type: String, default: '' },
  /** ink 底前缀段，例 '+86' / '¥' */
  prefix: { type: String, default: '' },
  /** paper-3 底后缀段，例 'CNY' */
  suffix: { type: String, default: '' },
  error: { type: Boolean, default: false },
  /** 倒计时段 { label, value }，例 { label: 'RESEND', value: '58s' } */
  countdown: { type: Object, default: null },
  maxlength: { type: [String, Number], default: null },
  inputmode: { type: String, default: null },
  ariaLabel: { type: String, default: '' },
  /** ibtn slot 存在时的可读 label */
  ibtnLabel: { type: String, default: 'Toggle' },
})

defineEmits(['update:modelValue', 'ibtn-click', 'submit'])
</script>

<template>
  <div class="ui-input" :class="{ 'ui-input--err': error }">
    <span v-if="prefix" class="ui-input__prefix">{{ prefix }}</span>

    <input
      :id="id || undefined"
      class="ui-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength || undefined"
      :inputmode="inputmode || undefined"
      :aria-label="ariaLabel || undefined"
      :aria-invalid="error || undefined"
      @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('submit')"
    />

    <button
      v-if="$slots.ibtn"
      type="button"
      class="ui-input__ibtn"
      :aria-label="ibtnLabel"
      @click="$emit('ibtn-click')"
    >
      <slot name="ibtn" />
    </button>

    <span v-if="countdown" class="ui-input__countdown">
      {{ countdown.label }}
      <span class="ui-input__countdown-num">{{ countdown.value }}</span>
    </span>

    <span v-if="suffix" class="ui-input__suffix">{{ suffix }}</span>
  </div>
</template>

<style scoped>
.ui-input {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 44px;
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  border-radius: var(--radius-none);
}

.ui-input:focus-within {
  box-shadow:
    inset 0 0 0 1.5px var(--hilite),
    0 0 0 2px var(--hilite);
}

.ui-input--err {
  border-color: var(--semantic-warning);
  box-shadow: inset 4px 0 0 0 var(--semantic-warning);
}
.ui-input--err:focus-within {
  box-shadow:
    inset 4px 0 0 0 var(--semantic-warning),
    inset 0 0 0 1.5px var(--hilite),
    0 0 0 2px var(--hilite);
}

.ui-input__prefix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 var(--space-10);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--f-mono);
  font-size: var(--text-sm); /* 12px */
  font-weight: 700;
  letter-spacing: 0.06em;
}

.ui-input__suffix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 var(--space-10);
  background: var(--paper-3);
  color: var(--ink-2);
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  border-left: 1.5px solid var(--ink);
}

.ui-input__field {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-base); /* 14px */
  font-weight: 500;
  padding: 0 var(--space-12);
  font-variant-numeric: tabular-nums;
}
.ui-input__field::placeholder {
  color: var(--ink-2);
  font-family: var(--f-mono);
  font-size: var(--text-sm); /* 12px */
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ui-input__ibtn {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  background: transparent;
  border: 0;
  border-left: 1.5px solid var(--ink);
  padding: 0 var(--space-10);
  color: var(--ink);
  cursor: pointer;
}
.ui-input__ibtn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1.5px var(--hilite);
}
.ui-input__ibtn :deep(svg) {
  width: 16px;
  height: 16px;
}

.ui-input__countdown {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  flex-shrink: 0;
  padding: 0 var(--space-12);
  background: var(--ink);
  color: var(--hilite);
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-left: 1.5px solid var(--ink);
}
.ui-input__countdown-num {
  color: var(--paper);
  font-variant-numeric: tabular-nums;
}
</style>
