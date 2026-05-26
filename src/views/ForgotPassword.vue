<script setup>
/**
 * ForgotPassword (PC) — 密码重置三步流程独立路由
 *
 * Spec: docs/user-auth-impl.md §9 P2（PC P2 任务）+ 总体方案 §6.6
 * Anchor: 复用 cd-5 Paper-CAD 表单 chrome / primitive
 *
 * 三步：
 *   STEP 1  identifier → POST /auth/password/reset/request (sendCode)
 *   STEP 2  verify code (6-digit) + 60s 重发倒计时
 *   STEP 3  set new password + confirm → POST /auth/password/reset/confirm
 *
 * 成功后：ElMessage.success → router.push('/login')
 *
 * 注：requestPasswordReset 仅触发后端发码（不返回 token），confirm 才真正重置。
 * 当前后端契约把 code 在 confirm 时校验，所以 STEP 2 在前端是「客户端格式校验」（6 位数字）。
  * @spec docs/design/user-auth/01-architecture.md#5.3.1
 * @spec docs/design/user-auth/01-architecture.md#6.5
 * @spec docs/design/user-auth/01-architecture.md#6.6
 * @capability user-auth.password-reset-flow
 * @since P2
 */
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { requestPasswordReset, confirmPasswordReset } from '@/service/auth'
import { useCountdown } from '@/utils/countdown'
import UiFormChrome from '@/components/ui/UiFormChrome.vue'
import UiPageTitle from '@/components/ui/UiPageTitle.vue'
import ForgotStepIdentifier from '@/components/auth/ForgotStepIdentifier.vue'
import ForgotStepCode from '@/components/auth/ForgotStepCode.vue'
import ForgotStepNewPassword from '@/components/auth/ForgotStepNewPassword.vue'

const { t } = useI18n()
const router = useRouter()

const RESEND_SECONDS = 60

const step = ref(1)
const form = reactive({ identifier: '', code: '' })
const loading = ref(false)
const countdown = useCountdown()

onUnmounted(() => countdown.reset())

const chromeTitle = computed(() => [
  t('auth.forgot.chrome.titleA'),
  t('auth.forgot.chrome.titleB'),
])
const telemetry = computed(() => [
  [t('auth.forgot.chrome.modeLabel'), t('auth.forgot.chrome.modeReset')],
  [
    t('auth.forgot.chrome.stepLabel'),
    t('auth.forgot.steps.of', { current: step.value, total: 3 }),
  ],
])
const pageSubtitle = computed(() => [
  t('auth.forgot.page.subtitleA'),
  t('auth.forgot.page.subtitleB'),
])
const stepLabels = computed(() => [
  t('auth.forgot.steps.stepA'),
  t('auth.forgot.steps.stepB'),
  t('auth.forgot.steps.stepC'),
])

const onBack = () => router.push('/login')
const onHelp = () =>
  ElMessage.info(t('common.toast.notAvailable', { label: t('login.foot.help') }))

const sendCode = async (target) => {
  loading.value = true
  try {
    await requestPasswordReset(target)
    countdown.start(RESEND_SECONDS)
    ElMessage.success(t('auth.forgot.msg.sendSuccess'))
    return true
  } catch (e) {
    // axios 拦截器已 toast 业务错误；这里兜底网络层
    if (!e?.code) ElMessage.error(t('auth.forgot.msg.sendFailed'))
    return false
  } finally {
    loading.value = false
  }
}

const onStep1Submit = async ({ identifier }) => {
  form.identifier = identifier
  const ok = await sendCode(identifier)
  if (ok) step.value = 2
}

const onResend = async () => {
  if (countdown.active.value) return
  await sendCode(form.identifier)
}

const onStep2Submit = ({ code }) => {
  if (!/^\d{6}$/.test(code)) {
    ElMessage.warning(t('auth.forgot.msg.codeRequired'))
    return
  }
  form.code = code
  step.value = 3
}

const onStep3Submit = async ({ newPassword }) => {
  loading.value = true
  try {
    await confirmPasswordReset({
      target: form.identifier,
      code: form.code,
      newPassword,
    })
    ElMessage.success(t('auth.forgot.msg.resetSuccess'))
    router.push('/login')
  } catch (e) {
    if (!e?.code) ElMessage.error(t('auth.forgot.msg.resetFailed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pc-forgot">
    <UiFormChrome
      :title="chromeTitle"
      :telemetry="telemetry"
      :right-label="t('auth.forgot.chrome.helpRightLabel')"
      @back="onBack"
      @right-click="onHelp"
    >
      <template #right-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 .8-2 1.3-2 2.5" />
          <circle cx="12" cy="17" r="0.8" fill="currentColor" />
        </svg>
      </template>
    </UiFormChrome>

    <div class="pc-forgot__stage">
      <div class="pc-forgot__card">
        <UiPageTitle :title="t('auth.forgot.page.title')" :sub="pageSubtitle" />

        <!-- Step progress bar -->
        <ol class="pc-forgot__steps" :aria-label="t('auth.forgot.page.title')">
          <li
            v-for="(label, idx) in stepLabels"
            :key="label"
            class="pc-forgot__step"
            :class="{
              'pc-forgot__step--done': idx + 1 < step,
              'pc-forgot__step--active': idx + 1 === step,
            }"
          >
            <span class="pc-forgot__step-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="pc-forgot__step-label">{{ label }}</span>
          </li>
        </ol>

        <ForgotStepIdentifier
          v-if="step === 1"
          v-model:identifier="form.identifier"
          :loading="loading"
          @submit="onStep1Submit"
        />
        <ForgotStepCode
          v-else-if="step === 2"
          v-model:code="form.code"
          :target="form.identifier"
          :resend-remaining="countdown.remaining.value"
          :loading="loading"
          @submit="onStep2Submit"
          @resend="onResend"
        />
        <ForgotStepNewPassword
          v-else
          :loading="loading"
          @submit="onStep3Submit"
        />

        <div class="pc-forgot__foot">
          <a href="#" @click.prevent="onBack">{{ t('auth.forgot.back') }}</a>
          <span class="pc-forgot__ver">FBW v3.47</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-forgot {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

.pc-forgot__stage {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--space-48) var(--space-24);
}

.pc-forgot__card {
  width: 480px;
  max-width: 100%;
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  padding: var(--space-24);
}

/* ── Step progress bar ── */
.pc-forgot__steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 0 var(--space-20);
  padding: 0;
  list-style: none;
  border: 1.5px solid var(--ink);
  background: var(--paper);
}

.pc-forgot__step {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-10);
  border-right: 1px dashed var(--ink-2);
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.pc-forgot__step:last-child {
  border-right: 0;
}
.pc-forgot__step--done {
  color: var(--accent-link);
  background: color-mix(in srgb, var(--hilite) 8%, var(--paper));
}
.pc-forgot__step--active {
  color: var(--ink);
  background: var(--hilite);
}
.pc-forgot__step-num {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ── Foot ── */
.pc-forgot__foot {
  margin-top: var(--space-14);
  padding-top: var(--space-12);
  border-top: 1px dashed var(--ink-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-forgot__foot a {
  color: var(--ink-2);
  text-decoration: none;
}
.pc-forgot__foot a:hover {
  color: var(--ink);
}
.pc-forgot__ver {
  color: var(--accent-link);
  font-weight: 600;
}
</style>
