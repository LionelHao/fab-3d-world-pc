<script setup>
/**
 * ForgotStepIdentifier — 密码重置 Step 1（输入手机/邮箱）
 *
 * Spec: docs/user-auth-impl.md §9 P2（密码重置三步流程）
 * Anchor: 复用 cd-5 Paper-CAD 表单 primitive
 *
 * 行为：纯展示组件，父级控制 loading + identifier 状态
 *   - emit('update:identifier', value)
 *   - emit('submit', { identifier })  仅在 identifier 非空时
 *   - emit('back') 给上层 chrome 返回钩子
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiFormSection from '@/components/ui/UiFormSection.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps({
  identifier: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:identifier', 'submit'])

const { t } = useI18n()
const touched = ref(false)

const showError = computed(() => touched.value && !props.identifier?.trim())

const onInput = (v) => emit('update:identifier', v)

const onSubmit = () => {
  touched.value = true
  if (!props.identifier?.trim() || props.loading) return
  emit('submit', { identifier: props.identifier.trim() })
}
</script>

<template>
  <div class="forgot-step">
    <UiFormSection
      :num="t('auth.forgot.stepIdentifier.stamp')"
      :name="t('auth.forgot.stepIdentifier.section')"
      stamp-tone="hilite"
      :stamp="t('auth.forgot.stepIdentifier.stamp')"
    >
      <UiFormField
        :label="t('auth.forgot.stepIdentifier.label')"
        required
        :hint="t('auth.forgot.stepIdentifier.hint')"
        :helper="showError
          ? t('auth.forgot.stepIdentifier.helperRequired')
          : t('auth.forgot.stepIdentifier.helper')"
        :helper-tone="showError ? 'warn' : 'default'"
        v-slot="{ fieldId }"
      >
        <UiInput
          :id="fieldId"
          :model-value="identifier"
          :placeholder="t('auth.forgot.stepIdentifier.placeholder')"
          :error="showError"
          @update:model-value="onInput"
          @submit="onSubmit"
        />
      </UiFormField>
    </UiFormSection>

    <div class="forgot-step__cta">
      <UiButton
        variant="primary"
        :badge="t('auth.forgot.stepIdentifier.ctaBadge')"
        :disabled="loading"
        @click="onSubmit"
      >
        <template #icon>
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </template>
        {{ t('auth.forgot.stepIdentifier.cta') }}
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
