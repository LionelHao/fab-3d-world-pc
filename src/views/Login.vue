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
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login, getUserInfo } from '@/service/user'
import UiFormChrome from '@/components/ui/UiFormChrome.vue'
import UiPageTitle from '@/components/ui/UiPageTitle.vue'
import UiFormSection from '@/components/ui/UiFormSection.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({ username: '', password: '', verifyCode: '' })
const errors = reactive({ username: false, password: false })
const showPwd = ref(false)
const loading = ref(false)

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
const countdown = computed(() => ({ label: 'RESEND', value: `${resend.value}s` }))

const onLogin = async () => {
  if (loading.value) return
  errors.username = !form.username
  errors.password = !form.password
  if (errors.username || errors.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const token = await login({ username: form.username, password: form.password })
    userStore.login(token, { username: form.username })
    try {
      const info = await getUserInfo()
      if (info) userStore.login(token, info)
    } catch (e) {
      // 资料获取失败不阻断登录
    }
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (error) {
    ElMessage.error('登录失败,请检查用户名或密码')
  } finally {
    loading.value = false
  }
}

const onRegister = () => ElMessage.info('注册 — 请联系运营开通账号')
const onBack = () => router.push('/home')
const onFootLink = (label) => ElMessage.info(`${label} — 暂未开放`)
</script>

<template>
  <div class="pc-login">
    <UiFormChrome
      :title="['LOGIN · ', 'ACCESS']"
      :telemetry="['SECURE', ['MODE', 'LOGIN'], ['SESSION', '0']]"
      right-label="Help"
      @back="onBack"
      @right-click="onFootLink('Help')"
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
        <UiPageTitle title="Operator Access" :sub="['FBW IDENTITY · ', 'V3.4']" />

        <UiFormSection num="§ 01" name="Credentials" stamp="REQ">
          <UiFormField
            label="Username"
            required
            hint="account id"
            :helper="errors.username ? 'USERNAME REQUIRED' : 'ENTER YOUR FBW OPERATOR ID'"
            :helper-tone="errors.username ? 'warn' : 'default'"
            v-slot="{ fieldId }"
          >
            <UiInput :id="fieldId" v-model="form.username" placeholder="operator id" :error="errors.username" />
          </UiFormField>

          <UiFormField
            label="Password"
            required
            hint="min 8 chars"
            :helper="errors.password ? 'PASSWORD REQUIRED' : ''"
            helper-tone="warn"
            v-slot="{ fieldId }"
          >
            <UiInput
              :id="fieldId"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="enter password"
              :error="errors.password"
              ibtn-label="Toggle password visibility"
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

          <UiFormField label="Verify Code" required hint="6 digits" helper="CODE WILL BE SENT VIA SMS · TYPE 6 DIGITS" v-slot="{ fieldId }">
            <UiInput :id="fieldId" v-model="form.verifyCode" inputmode="numeric" :maxlength="6" placeholder="------" :countdown="countdown" />
          </UiFormField>
        </UiFormSection>

        <div class="pc-login__cta">
          <UiButton variant="primary" badge="/AUTH" :disabled="loading" @click="onLogin">
            <template #icon>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </template>
            Sign In
          </UiButton>
          <UiButton variant="secondary" @click="onRegister">
            <template #icon>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
            </template>
            Register · Phone
          </UiButton>
        </div>

        <div class="pc-login__foot">
          <span>
            <a href="#" @click.prevent="onFootLink('Forgot')">Forgot</a>
            <span class="pc-login__sep"> · </span>
            <a href="#" @click.prevent="onFootLink('Help')">Help</a>
            <span class="pc-login__sep"> · </span>
            <a href="#" @click.prevent="onFootLink('Legal')">Legal</a>
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

.pc-login__foot {
  margin-top: var(--space-14);
  padding-top: var(--space-12);
  border-top: 1px dashed var(--ink-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 9px;
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
</style>
