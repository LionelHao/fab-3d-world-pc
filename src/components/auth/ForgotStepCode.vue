<script setup>
/**
 * ForgotStepCode — 密码重置 Step 2（输入验证码 + 重发）
 *
 * Spec: docs/user-auth-impl.md §9 P2
 *
 * 行为：父级 useCountdown 管 resendRemaining；本组件只读
 *   - emit('update:code', value)
 *   - emit('submit', { code })
 *   - emit('resend')  仅 resendRemaining === 0 时
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiFormSection from '@/components/ui/UiFormSection.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps({
  code: { type: String, default: '' },
  target: { type: String, default: '' },
  resendRemaining: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:code', 'submit', 'resend'])

const { t } = useI18n()
const touched = ref(false)

const codeValid = computed(() => /^\d{6}$/.test(props.code))
const showError = computed(() => touched.value && !codeValid.value)
const canResend = computed(() => props.resendRemaining <= 0)
const helperText = computed(() =>
  showError.value
    ? t('auth.forgot.stepCode.helperRequired')
    : t('auth.forgot.stepCode.helper', { target: props.target }),
)

const onInput = (v) => emit('update:code', String(v).replace(/\D/g, '').slice(0, 6))
const onSubmit = () => {
  touched.value = true
  if (!codeValid.value || props.loading) return
  emit('submit', { code: props.code })
}
const onResend = () => {
  if (!canResend.value) return
  emit('resend')
}
</script>

<template>
  <div class="forgot-step">
    <UiFormSection
      :num="t('auth.forgot.stepCode.stamp')"
      :name="t('auth.forgot.stepCode.section')"
      stamp-tone="hilite"
      :stamp="t('auth.forgot.stepCode.stamp')"
    >
      <UiFormField
        :label="t('auth.forgot.stepCode.label')"
        required
        :hint="t('auth.forgot.stepCode.hint')"
        :helper="helperText"
        :helper-tone="showError ? 'warn' : 'default'"
        v-slot="{ fieldId }"
      >
        <UiInput
          :id="fieldId"
          :model-value="code"
          inputmode="numeric"
          :maxlength="6"
          :placeholder="t('auth.forgot.stepCode.placeholder')"
          :error="showError"
          @update:model-value="onInput"
          @submit="onSubmit"
        />
      </UiFormField>

      <button
        type="button"
        class="forgot-step__resend"
        data-testid="resend-btn"
        :disabled="!canResend"
        @click="onResend"
      >
        <span class="forgot-step__resend-label">{{ t('auth.forgot.stepCode.resendLabel') }}</span>
        <span class="forgot-step__resend-val">
          <template v-if="!canResend">{{ resendRemaining }}s</template>
          <template v-else>{{ t('auth.forgot.stepCode.resendReady') }}</template>
        </span>
      </button>
    </UiFormSection>

    <div class="forgot-step__cta">
      <UiButton
        variant="primary"
        :badge="t('auth.forgot.stepCode.ctaBadge')"
        :disabled="loading"
        @click="onSubmit"
      >
        <template #icon>
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </template>
        {{ t('auth.forgot.stepCode.cta') }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.forgot-step {
  display: flex;
  flex-direction: column;
}
.forgot-step__cta {
  margin-top: var(--space-14);
}
.forgot-step__resend {
  margin-top: var(--space-8);
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--paper);
  border: 1px dashed var(--ink-2);
  padding: var(--space-4) var(--space-10);
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  cursor: pointer;
}
.forgot-step__resend:disabled {
  cursor: not-allowed;
  color: var(--ink-3);
  border-color: var(--ink-3);
}
.forgot-step__resend-val {
  color: var(--accent-link);
  font-variant-numeric: tabular-nums;
}
.forgot-step__resend:disabled .forgot-step__resend-val {
  color: var(--ink-3);
}
</style>
