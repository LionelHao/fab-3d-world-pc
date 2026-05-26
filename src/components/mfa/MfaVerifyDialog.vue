<script setup>
/**
 * MfaVerifyDialog (PC, user-auth P6)
 *
 * 通用「敏感操作前调」对话框：输入 6 位 TOTP code → POST /mfa/verify → emit verified
 * 父组件在 verified 钩里执行后续敏感动作（regenerate / view secret / ...）
  * @spec docs/design/user-auth/01-architecture.md#11
 * @capability user-auth.mfa-totp
 * @since P6
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElMessage } from 'element-plus'
import { verify as svcVerify } from '@/service/mfa'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'verified'])

const { t } = useI18n()

const visible = ref(props.modelValue)
const code = ref('')
const submitting = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) {
      code.value = ''
    }
  },
  { immediate: true },
)
watch(visible, (v) => emit('update:modelValue', v))

async function onSubmit() {
  if (submitting.value) return
  if (code.value.length < 6) {
    ElMessage.warning(t('auth.mfa.errors.invalidCode'))
    return
  }
  submitting.value = true
  try {
    await svcVerify(code.value)
    emit('verified', { code: code.value })
    visible.value = false
  } catch {
    // 拦截器已 toast
  } finally {
    submitting.value = false
  }
}

function onCancel() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('auth.mfa.verifyTitle')"
    width="400"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
  >
    <div data-test="mfa-verify-dialog" class="mfa-verify">
      <label class="mfa-verify__field">
        <span class="mfa-verify__label">{{ t('auth.mfa.verifyCodeLabel') }}</span>
        <input
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="mfa-verify__input"
          data-test="mfa-verify-code"
          v-model="code"
          placeholder="------"
        />
      </label>
    </div>
    <template #footer>
      <div class="mfa-verify__footer">
        <button
          type="button"
          class="mfa-verify__btn mfa-verify__btn--ghost"
          data-test="mfa-verify-cancel"
          @click="onCancel"
        >
          {{ t('auth.mfa.cancel') }}
        </button>
        <button
          type="button"
          class="mfa-verify__btn mfa-verify__btn--primary"
          :disabled="submitting || code.length < 6"
          data-test="mfa-verify-submit"
          @click="onSubmit"
        >
          {{ t('auth.mfa.verifySubmit') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.mfa-verify {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  color: var(--ink);
}
.mfa-verify__field { display: flex; flex-direction: column; gap: var(--space-4); }
.mfa-verify__label {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mfa-verify__input {
  font-family: var(--f-mono);
  font-size: var(--text-18);
  letter-spacing: 0.4em;
  text-align: center;
  padding: var(--space-8) var(--space-10);
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
}
.mfa-verify__input:focus { outline: none; box-shadow: var(--glow-accent-ring); }

.mfa-verify__footer { display: flex; justify-content: flex-end; gap: var(--space-10); }
.mfa-verify__btn {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-13);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--space-8) var(--space-16);
  cursor: pointer;
  border-radius: var(--radius-none);
  border: 1.5px solid var(--ink);
}
.mfa-verify__btn--primary { background: var(--hilite); color: var(--ink); }
.mfa-verify__btn--primary:hover:not(:disabled) { box-shadow: var(--glow-accent-md); }
.mfa-verify__btn--ghost { background: var(--paper); color: var(--ink); }
.mfa-verify__btn--ghost:hover { background: var(--paper-3); }
.mfa-verify__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mfa-verify__btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
