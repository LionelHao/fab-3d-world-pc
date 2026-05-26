<script setup>
/**
 * MfaSetupDialog (PC, user-auth P6)
 *
 * 双步：
 *   step=1：调 setup → 显示 QR + secret + 6 位 code 输入；点 Next → verifySetup → 推到 step 2
 *   step=2：展示 10 个一次性 recovery codes + 「我已保存」勾选 + 完成按钮 → emit finish
 *
 * 业务接入：service/mfa.setup / verifySetup
 * Tokens 严格：Paper-CAD ink/paper/hilite。
  * @spec docs/design/user-auth/01-architecture.md#11
 * @capability user-auth.mfa-totp
 * @since P6
 */
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElMessage } from 'element-plus'
import QrcodeVue from 'qrcode.vue'
import { setup as svcSetup, verifySetup } from '@/service/mfa'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'finish'])

const { t } = useI18n()

const step = ref(1)
const secret = ref('')
const qrUrl = ref('')
const code = ref('')
const verifying = ref(false)
const recoveryCodes = ref([])
const ack = ref(false)

const visible = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) initSetup()
  },
  { immediate: true },
)
watch(visible, (v) => emit('update:modelValue', v))

async function initSetup() {
  // 重置状态
  step.value = 1
  secret.value = ''
  qrUrl.value = ''
  code.value = ''
  recoveryCodes.value = []
  ack.value = false
  try {
    const data = await svcSetup()
    if (data) {
      secret.value = data.secret || ''
      qrUrl.value = data.qrUrl || ''
    }
  } catch {
    // 拦截器已 toast
  }
}

async function onVerify() {
  if (verifying.value) return
  if (!code.value || code.value.length < 6) {
    ElMessage.warning(t('auth.mfa.errors.invalidCode'))
    return
  }
  verifying.value = true
  try {
    const data = await verifySetup(code.value)
    recoveryCodes.value = Array.isArray(data?.recoveryCodes) ? data.recoveryCodes : []
    step.value = 2
  } catch {
    // 10402 已被拦截器 toast，保留 step=1
  } finally {
    verifying.value = false
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
    // 静默失败：复制不影响主流程
  }
}

function onFinish() {
  if (!ack.value) return
  emit('finish', { recoveryCodes: recoveryCodes.value })
  visible.value = false
}

function onCancel() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('auth.mfa.title')"
    width="480"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :append-to-body="true"
  >
    <div data-test="mfa-setup-dialog" class="mfa-setup">
      <!-- ── step 1 setup ── -->
      <template v-if="step === 1">
        <p class="mfa-setup__hint">{{ t('auth.mfa.setupQrPrompt') }}</p>
        <div v-if="qrUrl" class="mfa-setup__qr">
          <QrcodeVue :value="qrUrl" :size="180" level="M" render-as="svg" />
        </div>
        <div v-if="secret" class="mfa-setup__secret">
          <span class="mfa-setup__secret-label">
            {{ t('auth.mfa.setupSecretFallback') }}
          </span>
          <code class="mfa-setup__secret-value" data-test="mfa-setup-secret">{{ secret }}</code>
        </div>
        <label class="mfa-setup__field">
          <span class="mfa-setup__field-label">{{ t('auth.mfa.setupVerifyCode') }}</span>
          <input
            type="text"
            inputmode="numeric"
            maxlength="6"
            class="mfa-setup__input"
            data-test="mfa-setup-code"
            v-model="code"
            placeholder="------"
          />
        </label>
      </template>

      <!-- ── step 2 recovery codes ── -->
      <template v-else>
        <p class="mfa-setup__hint">{{ t('auth.mfa.recoveryCodesTitle') }}</p>
        <p class="mfa-setup__sub">{{ t('auth.mfa.recoveryCodesHint') }}</p>
        <ul class="mfa-setup__codes" data-test="mfa-setup-codes">
          <li v-for="c in recoveryCodes" :key="c" class="mfa-setup__code">
            <code>{{ c }}</code>
          </li>
        </ul>
        <button
          type="button"
          class="mfa-setup__copy"
          data-test="mfa-setup-copy"
          @click="onCopyAll"
        >
          {{ t('auth.mfa.recoveryCodesCopy') }}
        </button>
        <label class="mfa-setup__ack">
          <input
            type="checkbox"
            data-test="mfa-setup-ack"
            v-model="ack"
          />
          <span>{{ t('auth.mfa.recoveryCodesAck') }}</span>
        </label>
      </template>
    </div>

    <template #footer>
      <div class="mfa-setup__footer">
        <button
          type="button"
          class="mfa-setup__btn mfa-setup__btn--ghost"
          data-test="mfa-setup-cancel"
          @click="onCancel"
        >
          {{ t('auth.mfa.cancel') }}
        </button>
        <button
          v-if="step === 1"
          type="button"
          class="mfa-setup__btn mfa-setup__btn--primary"
          :disabled="verifying || code.length < 6"
          data-test="mfa-setup-verify"
          @click="onVerify"
        >
          {{ t('auth.mfa.setupVerifyCta') }}
        </button>
        <button
          v-else
          type="button"
          class="mfa-setup__btn mfa-setup__btn--primary"
          :disabled="!ack"
          data-test="mfa-setup-finish"
          @click="onFinish"
        >
          {{ t('auth.mfa.recoveryCodesFinish') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.mfa-setup {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  font-family: var(--f-cond);
  color: var(--ink);
}
.mfa-setup__hint {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.mfa-setup__sub {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.mfa-setup__qr {
  align-self: center;
  padding: var(--space-10);
  background: var(--paper);
  border: 1.5px solid var(--ink);
}
.mfa-setup__secret {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-10);
  background: var(--paper-2);
  border: 1px dashed var(--ink-2);
}
.mfa-setup__secret-label {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mfa-setup__secret-value {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  letter-spacing: 0.08em;
  color: var(--ink);
  word-break: break-all;
}
.mfa-setup__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.mfa-setup__field-label {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mfa-setup__input {
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
.mfa-setup__input:focus {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.mfa-setup__codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  list-style: none;
  margin: 0;
  padding: var(--space-10);
  background: var(--paper-2);
  border: 1.5px solid var(--ink);
}
.mfa-setup__code code {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  letter-spacing: 0.08em;
  color: var(--ink);
}
.mfa-setup__copy {
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
.mfa-setup__copy:hover { background: var(--paper-3); }

.mfa-setup__ack {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--f-cond);
  font-size: var(--text-12);
  color: var(--ink-2);
}

.mfa-setup__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-10);
}
.mfa-setup__btn {
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
.mfa-setup__btn--primary {
  background: var(--hilite);
  color: var(--ink);
}
.mfa-setup__btn--primary:hover:not(:disabled) { box-shadow: var(--glow-accent-md); }
.mfa-setup__btn--ghost { background: var(--paper); color: var(--ink); }
.mfa-setup__btn--ghost:hover { background: var(--paper-3); }
.mfa-setup__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mfa-setup__btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
