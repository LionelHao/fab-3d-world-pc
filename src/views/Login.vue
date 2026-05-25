<script setup>
/**
 * Login (PC) — 操作员登录（外推自 cd-5 ① · Paper-CAD 表单）
 *
 * Spec: docs/design/specs/p3.8-forms.md §1.5（PC Login 外推）
 * cd-5 仅出移动表单，本页按 cd-5 ① 结构外推到 PC：
 *   UiFormChrome 全宽顶条 + 居中表单卡（~440px）。
 *
 * 业务零修改: login() / getUserInfo() / userStore.login 保留（PC 为 username 登录）。
 * verify-code 走 mock 倒计时（无 SMS 后端），与移动端 Login 一致。
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { loginByPassword, loginMfaVerify, oauthAuthorize } from '@/service/auth'
import { getConfig as getCaptchaConfig } from '@/service/captcha'
import { getUserInfo } from '@/service/user'
import CaptchaWidget from '@/components/captcha/CaptchaWidget.vue'
import UiFormChrome from '@/components/ui/UiFormChrome.vue'
import UiPageTitle from '@/components/ui/UiPageTitle.vue'
import UiFormSection from '@/components/ui/UiFormSection.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({ identifier: '', password: '', verifyCode: '' })
const errors = reactive({ identifier: false, password: false })
const showPwd = ref(false)
const loading = ref(false)

/* ───── CAPTCHA（P6） ───── */
const captchaCfg = ref({ provider: 'mock', siteKey: '', required: false })
const captchaToken = ref('')

async function refreshCaptchaConfig() {
  try {
    const data = await getCaptchaConfig('login')
    captchaCfg.value = {
      provider: data?.provider || 'mock',
      siteKey: data?.siteKey || '',
      required: !!data?.required,
    }
  } catch {
    // 失败时退回到 mock（不强制）
    captchaCfg.value = { provider: 'mock', siteKey: '', required: false }
  }
}

function onCaptchaVerified(payload) {
  captchaToken.value = payload?.token || ''
}

onMounted(refreshCaptchaConfig)

/* ───── MFA 二段（P6） ───── */
const mfaStep = ref(false)
const mfaToken = ref('')
const mfaCode = ref('')
const mfaSubmitting = ref(false)

function resetMfa() {
  mfaStep.value = false
  mfaToken.value = ''
  mfaCode.value = ''
}

async function applyLoginResult(data) {
  if (data?.token && !userStore.token) {
    userStore.login(data.token, data.user || null, data.expireAt)
  }
  try {
    const info = await getUserInfo()
    if (info) userStore.updateUser(info)
  } catch (e) {
    // 资料获取失败不阻断登录
  }
  ElMessage.success(t('login.msg.loginSuccess'))
  const redirect = router.currentRoute.value.query?.from || '/home'
  router.push(typeof redirect === 'string' ? redirect : '/home')
}

async function onMfaSubmit() {
  if (mfaSubmitting.value) return
  if (mfaCode.value.length < 6) {
    ElMessage.warning(t('auth.mfa.errors.invalidCode'))
    return
  }
  mfaSubmitting.value = true
  try {
    const data = await loginMfaVerify(mfaToken.value, mfaCode.value)
    resetMfa()
    await applyLoginResult(data)
  } catch (error) {
    if (!error?.code) ElMessage.error(t('auth.mfa.errors.invalidCode'))
  } finally {
    mfaSubmitting.value = false
  }
}

function onMfaBack() {
  resetMfa()
}

// mock 倒计时（无 SMS 后端，纯装饰可观察元素）
const resend = ref(58)
let timer = null
const startCountdown = () => {
  resend.value = 58
  clearInterval(timer)
  timer = setInterval(() => {
    if (resend.value > 0) resend.value -= 1
    else clearInterval(timer)
  }, 1000)
}
onMounted(startCountdown)
onUnmounted(() => clearInterval(timer))
const countdown = computed(() => ({ label: t('login.field.verifyResend'), value: `${resend.value}s` }))

const chromeTitle = computed(() => [t('login.chrome.titleA'), t('login.chrome.titleB')])
const telemetry = computed(() => [
  t('login.chrome.telemetrySecure'),
  [t('login.chrome.telemetryModeLabel'), t('login.chrome.telemetryModeLogin')],
  [t('login.chrome.telemetrySessionLabel'), '0'],
])
const pageTitle = computed(() => t('login.page.title'))
const pageSubtitle = computed(() => [t('login.page.subtitleA'), t('login.page.subtitleB')])

const onLogin = async () => {
  if (loading.value) return
  errors.identifier = !form.identifier
  errors.password = !form.password
  if (errors.identifier || errors.password) {
    ElMessage.warning(t('login.msg.credentialsRequired'))
    return
  }
  if (captchaCfg.value.required && !captchaToken.value) {
    ElMessage.warning(t('auth.captcha.required'))
    return
  }
  loading.value = true
  try {
    // axios 拦截器在 /auth/login/* 成功时会自动写 store.login(token, user, expireAt)
    const payload = {
      identifier: form.identifier,
      password: form.password,
      deviceType: 'pc',
    }
    if (captchaToken.value) payload.captchaToken = captchaToken.value
    const data = await loginByPassword(payload)
    // P6: 后端要求 MFA → 不调 applyLoginResult，切到 MFA step（拦截器对 requireMfa 不写 store）
    if (data?.requireMfa && data?.mfaToken) {
      mfaToken.value = data.mfaToken
      mfaStep.value = true
      mfaCode.value = ''
      ElMessage.info(t('auth.login.mfaPrompt'))
      return
    }
    await applyLoginResult(data)
  } catch (error) {
    // 失败响应携带 requireCaptcha → 拉新配置 + 显示 widget（即便服务端原本未要求）
    if (error?.data?.requireCaptcha) {
      captchaCfg.value = {
        provider: error.data.provider || captchaCfg.value.provider,
        siteKey: error.data.siteKey || '',
        required: true,
      }
      captchaToken.value = ''
    } else if (error?.requireCaptcha) {
      captchaCfg.value = {
        provider: error.provider || captchaCfg.value.provider,
        siteKey: error.siteKey || '',
        required: true,
      }
      captchaToken.value = ''
    }
    // 拦截器已 toast；此处兜底再 toast 防御未走拦截器的网络层错误
    if (!error?.code) ElMessage.error(t('login.msg.loginFailed'))
  } finally {
    loading.value = false
  }
}

const onRegister = () => ElMessage.info(t('login.msg.registerContactOps'))
const onBack = () => router.push('/home')
const onFootLink = (label) => ElMessage.info(t('common.toast.notAvailable', { label }))
const onForgot = () => router.push('/forgot-password')

/* ───── OAuth (P5) — 桌面 provider 集合（PC 不出 wechat-mp，per impl §0.3）───── */
const OAUTH_PROVIDERS = ['google', 'github', 'apple']
const oauthBusy = ref(null)

const providerLabel = (id) => {
  const key = id === 'wechat-mp' ? 'wechatMp' : id
  return t(`auth.oauth.providers.${key}`)
}

const startOAuth = async (provider) => {
  if (oauthBusy.value) return
  oauthBusy.value = provider
  try {
    const redirectUri = `${window.location.origin}/oauth/callback/${provider}`
    const data = await oauthAuthorize(provider, { redirectUri })
    if (data?.authorizeUrl) {
      window.location.href = data.authorizeUrl
      return
    }
    ElMessage.error(t('auth.oauth.bindStartFailed'))
  } catch (err) {
    if (!err?.code) ElMessage.error(t('auth.oauth.bindStartFailed'))
  } finally {
    oauthBusy.value = null
  }
}
</script>

<template>
  <div class="pc-login">
    <UiFormChrome
      :title="chromeTitle"
      :telemetry="telemetry"
      :right-label="t('login.chrome.helpRightLabel')"
      @back="onBack"
      @right-click="onFootLink(t('login.foot.help'))"
    >
      <template #right-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 .8-2 1.3-2 2.5" />
          <circle cx="12" cy="17" r="0.8" fill="currentColor" />
        </svg>
      </template>
    </UiFormChrome>

    <div class="pc-login__stage">
      <div class="pc-login__card">
        <UiPageTitle :title="pageTitle" :sub="pageSubtitle" />

        <!-- P6: MFA 二段 -->
        <div v-if="mfaStep" class="pc-login__mfa" data-test="login-mfa-step">
          <p class="pc-login__mfa-prompt">{{ t('auth.login.mfaPrompt') }}</p>
          <label class="pc-login__mfa-field">
            <span class="pc-login__mfa-label">{{ t('auth.login.mfaCodeLabel') }}</span>
            <input
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="pc-login__mfa-input"
              data-test="login-mfa-code"
              v-model="mfaCode"
              :placeholder="t('auth.login.mfaCodePlaceholder')"
            />
          </label>
          <div class="pc-login__mfa-actions">
            <button
              type="button"
              class="pc-login__mfa-btn pc-login__mfa-btn--ghost"
              data-test="login-mfa-back"
              :disabled="mfaSubmitting"
              @click="onMfaBack"
            >
              {{ t('auth.login.mfaBack') }}
            </button>
            <button
              type="button"
              class="pc-login__mfa-btn pc-login__mfa-btn--primary"
              data-test="login-mfa-submit"
              :disabled="mfaSubmitting || mfaCode.length < 6"
              @click="onMfaSubmit"
            >
              {{ t('auth.login.mfaSubmit') }}
            </button>
          </div>
        </div>

        <UiFormSection v-else num="§ 01" :name="t('login.section.credentialsName')" :stamp="t('login.section.stampRequired')">
          <UiFormField
            :label="t('login.field.identifierLabel')"
            required
            :hint="t('login.field.identifierHint')"
            :helper="errors.identifier ? t('login.field.identifierHelperRequired') : t('login.field.identifierHelperDefault')"
            :helper-tone="errors.identifier ? 'warn' : 'default'"
            v-slot="{ fieldId }"
          >
            <UiInput :id="fieldId" v-model="form.identifier" :placeholder="t('login.field.identifierPlaceholder')" :error="errors.identifier" />
          </UiFormField>

          <UiFormField
            :label="t('login.field.passwordLabel')"
            required
            :hint="t('login.field.passwordHint')"
            :helper="errors.password ? t('login.field.passwordHelperRequired') : ''"
            helper-tone="warn"
            v-slot="{ fieldId }"
          >
            <UiInput
              :id="fieldId"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              :placeholder="t('login.field.passwordPlaceholder')"
              :error="errors.password"
              :ibtn-label="t('login.field.passwordToggleAria')"
              @ibtn-click="showPwd = !showPwd"
              @submit="onLogin"
            >
              <template #ibtn>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </template>
            </UiInput>
          </UiFormField>

          <UiFormField :label="t('login.field.verifyLabel')" required :hint="t('login.field.verifyHint')" :helper="t('login.field.verifyHelper')" v-slot="{ fieldId }">
            <UiInput :id="fieldId" v-model="form.verifyCode" inputmode="numeric" :maxlength="6" :placeholder="t('login.field.verifyPlaceholder')" :countdown="countdown" />
          </UiFormField>
        </UiFormSection>

        <div v-if="!mfaStep && captchaCfg.required" class="pc-login__captcha">
          <CaptchaWidget
            :provider="captchaCfg.provider"
            :site-key="captchaCfg.siteKey"
            @verified="onCaptchaVerified"
          />
        </div>

        <div v-if="!mfaStep" class="pc-login__cta">
          <UiButton variant="primary" :badge="t('login.cta.badgeAuth')" :disabled="loading" @click="onLogin">
            <template #icon>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </template>
            {{ t('login.cta.signIn') }}
          </UiButton>
          <UiButton variant="secondary" @click="onRegister">
            <template #icon>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
            </template>
            {{ t('login.cta.register') }}
          </UiButton>
        </div>

        <div v-if="!mfaStep" class="pc-login__oauth" data-test="oauth-block">
          <div class="pc-login__oauth-divider">
            <span class="pc-login__oauth-divider-line" />
            <span class="pc-login__oauth-divider-label">{{ t('auth.oauth.divider') }}</span>
            <span class="pc-login__oauth-divider-line" />
          </div>
          <div class="pc-login__oauth-list">
            <button
              v-for="p in OAUTH_PROVIDERS"
              :key="p"
              type="button"
              class="pc-login__oauth-btn"
              :disabled="oauthBusy === p"
              :data-test="`oauth-btn-${p}`"
              @click="startOAuth(p)"
            >
              {{ providerLabel(p) }}
            </button>
          </div>
        </div>

        <div class="pc-login__foot">
          <span>
            <a href="#" data-testid="forgot-link" @click.prevent="onForgot">{{ t('login.foot.forgot') }}</a>
            <span class="pc-login__sep"> · </span>
            <a href="#" @click.prevent="onFootLink(t('login.foot.help'))">{{ t('login.foot.help') }}</a>
            <span class="pc-login__sep"> · </span>
            <a href="#" @click.prevent="onFootLink(t('login.foot.legal'))">{{ t('login.foot.legal') }}</a>
          </span>
          <span class="pc-login__ver">FBW v3.47</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-login {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

.pc-login__stage {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 64px 24px;
}

.pc-login__card {
  width: 440px;
  max-width: 100%;
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  padding: var(--space-24);
}

.pc-login__cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  margin-top: var(--space-14);
  margin-bottom: var(--space-8);
}

.pc-login__captcha {
  margin-top: var(--space-14);
}

.pc-login__oauth {
  margin-top: var(--space-14);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}
.pc-login__oauth-divider {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-login__oauth-divider-line {
  flex: 1;
  height: 1px;
  background: var(--ink-3);
}
.pc-login__oauth-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}
.pc-login__oauth-btn {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-12);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--space-8) var(--space-10);
  cursor: pointer;
  border-radius: var(--radius-none);
}
.pc-login__oauth-btn:hover:not(:disabled) { background: var(--paper-3); }
.pc-login__oauth-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-login__oauth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pc-login__foot {
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
.pc-login__foot a {
  color: var(--ink-2);
  text-decoration: none;
}
.pc-login__foot a:hover {
  color: var(--ink);
}
.pc-login__sep {
  color: var(--ink-3);
}
.pc-login__ver {
  color: var(--accent-link);
  font-weight: 600;
}

/* ───── MFA 二段 (P6) ───── */
.pc-login__mfa {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-14);
  border: 1.5px solid var(--ink);
  background: var(--paper);
  margin-bottom: var(--space-14);
}
.pc-login__mfa-prompt {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.pc-login__mfa-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.pc-login__mfa-label {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-login__mfa-input {
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
.pc-login__mfa-input:focus { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-login__mfa-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-10);
}
.pc-login__mfa-btn {
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
.pc-login__mfa-btn--primary { background: var(--hilite); color: var(--ink); }
.pc-login__mfa-btn--primary:hover:not(:disabled) { box-shadow: var(--glow-accent-md); }
.pc-login__mfa-btn--ghost { background: var(--paper); color: var(--ink); }
.pc-login__mfa-btn--ghost:hover { background: var(--paper-3); }
.pc-login__mfa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pc-login__mfa-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
