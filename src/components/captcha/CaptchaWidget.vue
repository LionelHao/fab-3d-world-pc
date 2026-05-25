<script setup>
/**
 * CaptchaWidget (PC, user-auth P6)
 *
 * 根据 provider 渲染人机验证 UI：
 *   - 'mock': dev-only checkbox，点选后 emit token='mock-pass'
 *   - 'hcaptcha': 占位 div + data-sitekey；prod 需补 HCaptcha JS SDK 加载逻辑
 *   - 'turnstile': 同 hcaptcha 占位
 *
 * Spec: docs/user-auth-impl.md §11 P6
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  provider: { type: String, default: 'mock' },
  siteKey: { type: String, default: '' },
})
const emit = defineEmits(['verified'])

const { t } = useI18n()
const checked = ref(false)

watch(
  () => props.provider,
  () => {
    // provider 切换 → 清空 token
    checked.value = false
    emit('verified', { token: null })
  },
)

function onMockToggle(e) {
  checked.value = !!e.target.checked
  if (checked.value) {
    emit('verified', { token: 'mock-pass' })
  } else {
    emit('verified', { token: null })
  }
}
</script>

<template>
  <div data-test="captcha-widget" class="captcha-widget">
    <span class="captcha-widget__title">{{ t('auth.captcha.title') }}</span>

    <!-- mock provider -->
    <label
      v-if="provider === 'mock'"
      class="captcha-widget__mock"
    >
      <input
        type="checkbox"
        data-test="captcha-mock-checkbox"
        :checked="checked"
        @change="onMockToggle"
      />
      <span>{{ checked ? t('auth.captcha.passed') : t('auth.captcha.checkbox') }}</span>
    </label>

    <!-- hcaptcha 占位（真实 SDK 加载留给后续） -->
    <div
      v-else-if="provider === 'hcaptcha'"
      data-test="captcha-hcaptcha"
      class="captcha-widget__placeholder"
      :data-sitekey="siteKey"
    >
      hCaptcha {{ siteKey ? '' : '(no sitekey)' }}
    </div>

    <!-- turnstile 占位 -->
    <div
      v-else-if="provider === 'turnstile'"
      data-test="captcha-turnstile"
      class="captcha-widget__placeholder"
      :data-sitekey="siteKey"
    >
      Turnstile
    </div>

    <!-- 未知 provider -->
    <div v-else class="captcha-widget__placeholder">
      {{ t('auth.captcha.loadFailed') }}
    </div>
  </div>
</template>

<style scoped>
.captcha-widget {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-10);
  border: 1.5px solid var(--ink);
  background: var(--paper);
}
.captcha-widget__title {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.captcha-widget__mock {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--f-cond);
  font-size: var(--text-12);
  color: var(--ink);
  cursor: pointer;
}
.captcha-widget__placeholder {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-3);
  letter-spacing: 0.04em;
  padding: var(--space-8) var(--space-10);
  border: 1px dashed var(--ink-2);
}
</style>
