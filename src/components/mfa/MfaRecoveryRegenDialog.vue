<script setup>
/**
 * MfaRecoveryRegenDialog (PC, user-auth P6)
 *
 * 双步：
 *   step=1：输入 6 位 code + 警告 → POST /mfa/recovery-codes → 切 step=2
 *   step=2：展示 10 个新 recovery codes + ack 勾选 + 完成 → emit regenerated
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElMessage } from 'element-plus'
import { regenerateRecoveryCodes } from '@/service/mfa'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'regenerated'])

const { t } = useI18n()

const visible = ref(props.modelValue)
const step = ref(1)
const code = ref('')
const submitting = ref(false)
const recoveryCodes = ref([])
const ack = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) {
      step.value = 1
      code.value = ''
      recoveryCodes.value = []
      ack.value = false
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
    const data = await regenerateRecoveryCodes(code.value)
    recoveryCodes.value = Array.isArray(data?.recoveryCodes) ? data.recoveryCodes : []
    step.value = 2
  } catch {
    // 拦截器 toast
  } finally {
    submitting.value = false
  }
}

async function onCopyAll() {
  try {
    const text = recoveryCodes.value.join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      ElMessage.success(t('auth.mfa.recoveryCodesCopied'))
    }
  } catch {
    // ignore
  }
}

function onFinish() {
  if (!ack.value) return
  emit('regenerated', { recoveryCodes: recoveryCodes.value })
  visible.value = false
}

function onCancel() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('auth.mfa.regenerate')"
    width="460"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
  >
    <div data-test="mfa-regen-dialog" class="mfa-regen">
      <template v-if="step === 1">
        <p class="mfa-regen__warn">{{ t('auth.mfa.regenerateConfirm') }}</p>
        <label class="mfa-regen__field">
          <span class="mfa-regen__label">{{ t('auth.mfa.verifyCodeLabel') }}</span>
          <input
            type="text"
            inputmode="numeric"
            maxlength="6"
            class="mfa-regen__input"
            data-test="mfa-regen-code"
            v-model="code"
            placeholder="------"
          />
        </label>
      </template>

      <template v-else>
        <p class="mfa-regen__hint">{{ t('auth.mfa.recoveryCodesTitle') }}</p>
        <ul class="mfa-regen__codes">
          <li v-for="c in recoveryCodes" :key="c" class="mfa-regen__code">
            <code>{{ c }}</code>
          </li>
        </ul>
        <button
          type="button"
          class="mfa-regen__copy"
          data-test="mfa-regen-copy"
          @click="onCopyAll"
        >
          {{ t('auth.mfa.recoveryCodesCopy') }}
        </button>
        <label class="mfa-regen__ack">
          <input
            type="checkbox"
            data-test="mfa-regen-ack"
            v-model="ack"
          />
          <span>{{ t('auth.mfa.recoveryCodesAck') }}</span>
        </label>
      </template>
    </div>

    <template #footer>
      <div class="mfa-regen__footer">
        <button
          type="button"
          class="mfa-regen__btn mfa-regen__btn--ghost"
          data-test="mfa-regen-cancel"
          @click="onCancel"
        >
          {{ t('auth.mfa.cancel') }}
        </button>
        <button
          v-if="step === 1"
          type="button"
          class="mfa-regen__btn mfa-regen__btn--primary"
          :disabled="submitting || code.length < 6"
          data-test="mfa-regen-submit"
          @click="onSubmit"
        >
          {{ t('auth.mfa.regenerate') }}
        </button>
        <button
          v-else
          type="button"
          class="mfa-regen__btn mfa-regen__btn--primary"
          :disabled="!ack"
          data-test="mfa-regen-finish"
          @click="onFinish"
        >
          {{ t('auth.mfa.recoveryCodesFinish') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.mfa-regen {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  color: var(--ink);
}
.mfa-regen__warn {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--semantic-warning);
  letter-spacing: 0.04em;
}
.mfa-regen__hint {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.mfa-regen__field { display: flex; flex-direction: column; gap: var(--space-4); }
.mfa-regen__label {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mfa-regen__input {
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
.mfa-regen__input:focus { outline: none; box-shadow: var(--glow-accent-ring); }

.mfa-regen__codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  list-style: none;
  margin: 0;
  padding: var(--space-10);
  background: var(--paper-2);
  border: 1.5px solid var(--ink);
}
.mfa-regen__code code {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  letter-spacing: 0.08em;
  color: var(--ink);
}
.mfa-regen__copy {
  align-self: flex-start;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-11);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--space-4) var(--space-10);
  cursor: pointer;
  border-radius: var(--radius-none);
}
.mfa-regen__copy:hover { background: var(--paper-3); }

.mfa-regen__ack {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--f-cond);
  font-size: var(--text-12);
  color: var(--ink-2);
}

.mfa-regen__footer { display: flex; justify-content: flex-end; gap: var(--space-10); }
.mfa-regen__btn {
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
.mfa-regen__btn--primary { background: var(--hilite); color: var(--ink); }
.mfa-regen__btn--primary:hover:not(:disabled) { box-shadow: var(--glow-accent-md); }
.mfa-regen__btn--ghost { background: var(--paper); color: var(--ink); }
.mfa-regen__btn--ghost:hover { background: var(--paper-3); }
.mfa-regen__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mfa-regen__btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
