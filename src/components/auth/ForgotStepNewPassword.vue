<script setup>
/**
 * ForgotStepNewPassword — 密码重置 Step 3（设新密码）
 *
 * Spec: docs/user-auth-impl.md §9 P2
 *
 * 行为：本地维护 new/confirm 双输入；校验 ≥8 位 + match
 *   - emit('submit', { newPassword })
 */
import { reactive, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiFormSection from '@/components/ui/UiFormSection.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['submit'])

const { t } = useI18n()
const form = reactive({ newPw: '', confirmPw: '' })
const touched = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const newMissing = computed(() => !form.newPw)
const newWeak = computed(() => !!form.newPw && form.newPw.length < 8)
const newInvalid = computed(() => newMissing.value || newWeak.value)
const mismatch = computed(() => !!form.newPw && form.confirmPw !== form.newPw)
const valid = computed(() => !newInvalid.value && !mismatch.value)

const newHelper = computed(() => {
  if (!touched.value) return t('auth.forgot.stepNew.newHelper')
  if (newMissing.value) return t('auth.forgot.stepNew.newHelperRequired')
  if (newWeak.value) return t('auth.forgot.stepNew.newHelperWeak')
  return t('auth.forgot.stepNew.newHelper')
})
const newTone = computed(() => (touched.value && newInvalid.value ? 'warn' : 'default'))

const confirmHelper = computed(() => {
  if (!touched.value) return t('auth.forgot.stepNew.confirmHelper')
  if (mismatch.value) return t('auth.forgot.stepNew.confirmHelperMismatch')
  return t('auth.forgot.stepNew.confirmHelper')
})
const confirmTone = computed(() => (touched.value && mismatch.value ? 'warn' : 'default'))

const onSubmit = () => {
  touched.value = true
  if (!valid.value || props.loading) return
  emit('submit', { newPassword: form.newPw })
}
</script>

<template>
  <div class="forgot-step">
    <UiFormSection
      :num="t('auth.forgot.stepNew.stamp')"
      :name="t('auth.forgot.stepNew.section')"
      stamp-tone="hilite"
      :stamp="t('auth.forgot.stepNew.stamp')"
    >
      <UiFormField
        :label="t('auth.forgot.stepNew.newLabel')"
        required
        :hint="t('auth.forgot.stepNew.newHint')"
        :helper="newHelper"
        :helper-tone="newTone"
        v-slot="{ fieldId }"
      >
        <UiInput
          :id="fieldId"
          v-model="form.newPw"
          :type="showNew ? 'text' : 'password'"
          :placeholder="t('auth.forgot.stepNew.newPlaceholder')"
          :error="touched && newInvalid"
          :ibtn-label="t('auth.forgot.stepNew.toggleAria')"
          @ibtn-click="showNew = !showNew"
        >
          <template #ibtn>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </template>
        </UiInput>
      </UiFormField>

      <UiFormField
        :label="t('auth.forgot.stepNew.confirmLabel')"
        required
        :hint="t('auth.forgot.stepNew.confirmHint')"
        :helper="confirmHelper"
        :helper-tone="confirmTone"
        v-slot="{ fieldId }"
      >
        <UiInput
          :id="fieldId"
          v-model="form.confirmPw"
          :type="showConfirm ? 'text' : 'password'"
          :placeholder="t('auth.forgot.stepNew.confirmPlaceholder')"
          :error="touched && mismatch"
          :ibtn-label="t('auth.forgot.stepNew.toggleAria')"
          @ibtn-click="showConfirm = !showConfirm"
          @submit="onSubmit"
        >
          <template #ibtn>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </template>
        </UiInput>
      </UiFormField>
    </UiFormSection>

    <div class="forgot-step__cta">
      <UiButton
        variant="primary"
        :badge="t('auth.forgot.stepNew.ctaBadge')"
        :disabled="loading"
        @click="onSubmit"
      >
        <template #icon>
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </template>
        {{ t('auth.forgot.stepNew.cta') }}
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
</style>
