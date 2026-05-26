<script setup>
/**
 * MfaDisableDialog (PC, user-auth P6)
 *
 * 输入登录密码 + 6 位 TOTP code → POST /mfa/disable → emit disabled
  * @spec docs/design/user-auth/01-architecture.md#11
 * @capability user-auth.mfa-totp
 * @since P6
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElMessage } from 'element-plus'
import { disable as svcDisable } from '@/service/mfa'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'disabled'])

const { t } = useI18n()

const visible = ref(props.modelValue)
const password = ref('')
const code = ref('')
const submitting = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) {
      password.value = ''
      code.value = ''
    }
  },
  { immediate: true },
)
watch(visible, (v) => emit('update:modelValue', v))

async function onSubmit() {
  if (submitting.value) return
  if (!password.value || code.value.length < 6) {
    ElMessage.warning(t('auth.mfa.errors.invalidCode'))
    return
  }
  submitting.value = true
  try {
    await svcDisable(password.value, code.value)
    emit('disabled')
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
    :title="t('auth.mfa.disableTitle')"
    width="420"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
  >
    <div data-test="mfa-disable-dialog" class="mfa-disable">
      <p class="mfa-disable__warn">{{ t('auth.mfa.disableConfirm') }}</p>
      <label class="mfa-disable__field">
        <span class="mfa-disable__label">{{ t('auth.mfa.disablePasswordLabel') }}</span>
        <input
          type="password"
          class="mfa-disable__input"
          data-test="mfa-disable-password"
          v-model="password"
          autocomplete="current-password"
        />
      </label>
      <label class="mfa-disable__field">
        <span class="mfa-disable__label">{{ t('auth.mfa.disableCodeLabel') }}</span>
        <input
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="mfa-disable__input mfa-disable__input--code"
          data-test="mfa-disable-code"
          v-model="code"
          placeholder="------"
        />
      </label>
    </div>
    <template #footer>
      <div class="mfa-disable__footer">
        <button
          type="button"
          class="mfa-disable__btn mfa-disable__btn--ghost"
          data-test="mfa-disable-cancel"
          @click="onCancel"
        >
          {{ t('auth.mfa.cancel') }}
        </button>
        <button
          type="button"
          class="mfa-disable__btn mfa-disable__btn--danger"
          :disabled="submitting || !password || code.length < 6"
          data-test="mfa-disable-submit"
          @click="onSubmit"
        >
          {{ t('auth.mfa.disableSubmit') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.mfa-disable {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  color: var(--ink);
}
.mfa-disable__warn {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--semantic-warning);
  letter-spacing: 0.04em;
}
.mfa-disable__field { display: flex; flex-direction: column; gap: var(--space-4); }
.mfa-disable__label {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mfa-disable__input {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  padding: var(--space-8) var(--space-10);
  background: var(--paper);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
}
.mfa-disable__input--code {
  font-size: var(--text-18);
  letter-spacing: 0.4em;
  text-align: center;
}
.mfa-disable__input:focus { outline: none; box-shadow: var(--glow-accent-ring); }

.mfa-disable__footer { display: flex; justify-content: flex-end; gap: var(--space-10); }
.mfa-disable__btn {
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
.mfa-disable__btn--danger {
  background: var(--paper);
  color: var(--semantic-warning);
  border-color: var(--semantic-warning);
}
.mfa-disable__btn--danger:hover:not(:disabled) { background: var(--paper-3); }
.mfa-disable__btn--ghost { background: var(--paper); color: var(--ink); }
.mfa-disable__btn--ghost:hover { background: var(--paper-3); }
.mfa-disable__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mfa-disable__btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
