<script setup>
/**
 * SettingsSecurity (PC) — 账户安全独立路由（user-auth P3）
 *
 * Spec: docs/user-auth-impl.md §4（PC P3 — Settings/Security 区）
 *
 * 装配:
 *   PcNavbar + UiPageTitle + UiCard×2:
 *     § 01  修改密码          → ElDialog（旧 / 新 / 确认 三字段 + 强度提示）
 *     § 02  已登录设备        → PcSessionList（GET /auth/sessions, revoke, revoke-others）
 *
 * 业务接入:
 *   GET  /auth/sessions
 *   POST /auth/sessions/{tokenValue}/revoke
 *   POST /auth/sessions/revoke-others
 *   POST /auth/password/change   → 后端会下线全部 → 前端 logout + push('/login')
 *
 * 不放进 Profile 视图（per spec §4.0 + 总体 §10.6）。
 * Paper-CAD token 严格使用；不出现硬编码色值 / 圆角 / 字号。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElPopconfirm,
  ElMessage,
} from 'element-plus'

import PcNavbar from '@/components/PcNavbar.vue'
import PcFooter from '@/components/PcFooter.vue'
import UiPageTitle from '@/components/ui/UiPageTitle.vue'
import UiButton from '@/components/ui/UiButton.vue'
import PcSessionList from '@/components/settings/PcSessionList.vue'

import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
  changePassword,
  logout,
} from '@/service/auth'
import { useUserStore } from '@/stores/user'
import { validatePassword, scorePassword, MIN_PASSWORD_LENGTH } from '@/utils/passwordPolicy'
import {
  brandConstants,
  navLinks,
  searchDefaults,
  localePack,
} from '@/mocks/cd-3-fixture.js'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

/* ───── chrome 文案 (借 home 命名空间) ───── */
const NAV_KEYS = {
  catalog: 'home.nav.catalog',
  market: 'home.nav.market',
  studio: 'home.nav.studio',
  lab_log: 'home.nav.labLog',
}
const localizedNavLinks = computed(() =>
  navLinks.map((l) => ({ ...l, label: NAV_KEYS[l.id] ? t(NAV_KEYS[l.id]) : l.label })),
)
const searchValue = ref('')

const onLogoClick = () => router.push('/home').catch(() => {})
const onNavClick = (link) => link.route && router.push(link.route).catch(() => {})
const onSearch = () => {}
const onLocaleClick = () => {}
const onBellClick = () => {}
const onUploadClick = () => {}
const onAvatarClick = () => router.push('/profile').catch(() => {})

/* ───── 设备列表状态 ───── */
const sessions = ref([])
const loadingSessions = ref(false)

async function refreshSessions() {
  loadingSessions.value = true
  try {
    const data = await listSessions()
    sessions.value = Array.isArray(data) ? data : []
  } catch {
    sessions.value = []
  } finally {
    loadingSessions.value = false
  }
}

async function onRevoke(tokenValue) {
  if (!tokenValue) return
  try {
    await revokeSession(tokenValue)
    ElMessage.success(t('settings.security.sessions.revokeSuccess'))
    await refreshSessions()
  } catch {
    // 拦截器已 toast
  }
}

async function onRevokeOthers() {
  try {
    await revokeOtherSessions()
    ElMessage.success(t('settings.security.sessions.revokeOthersSuccess'))
    await refreshSessions()
  } catch {
    // 拦截器已 toast
  }
}

/* ───── 改密对话框状态 ───── */
const pwOpen = ref(false)
const pwForm = reactive({ old: '', next: '', confirm: '' })
const pwErrors = reactive({ old: false, next: false, confirm: false })
const submittingPw = ref(false)

const strength = computed(() => scorePassword(pwForm.next))
const strengthLabel = computed(() => {
  switch (strength.value) {
    case 1: return t('settings.security.password.strengthWeak')
    case 2: return t('settings.security.password.strengthFair')
    case 3: return t('settings.security.password.strengthGood')
    case 4: return t('settings.security.password.strengthStrong')
    default: return ''
  }
})

function resetPwForm() {
  pwForm.old = ''
  pwForm.next = ''
  pwForm.confirm = ''
  pwErrors.old = false
  pwErrors.next = false
  pwErrors.confirm = false
}

function openPwDialog() {
  resetPwForm()
  pwOpen.value = true
}

function closePwDialog() {
  pwOpen.value = false
  resetPwForm()
}

async function submitPw() {
  if (submittingPw.value) return
  pwErrors.old = false
  pwErrors.next = false
  pwErrors.confirm = false

  if (!pwForm.old) {
    pwErrors.old = true
    ElMessage.warning(t('settings.security.password.oldHelperRequired'))
    return
  }

  const check = validatePassword(pwForm.next)
  if (!check.ok) {
    pwErrors.next = true
    if (check.reason === 'required') {
      ElMessage.warning(t('settings.security.password.newHelperRequired'))
    } else {
      ElMessage.warning(t('settings.security.password.newHelperWeak', { min: MIN_PASSWORD_LENGTH }))
    }
    return
  }

  if (pwForm.next !== pwForm.confirm) {
    pwErrors.confirm = true
    ElMessage.warning(t('settings.security.password.mismatch'))
    return
  }

  if (pwForm.next === pwForm.old) {
    pwErrors.next = true
    ElMessage.warning(t('settings.security.password.sameAsOld'))
    return
  }

  submittingPw.value = true
  try {
    await changePassword({ oldPassword: pwForm.old, newPassword: pwForm.next })
    ElMessage.success(t('settings.security.password.success'))
    closePwDialog()
    try { await logout() } catch { /* 后端已下线，本地继续清理 */ }
    userStore.logout()
    router.push('/login')
  } catch {
    // 拦截器已 toast
  } finally {
    submittingPw.value = false
  }
}

onMounted(refreshSessions)
</script>

<template>
  <div class="ss-pc">
    <PcNavbar
      v-model:search-value="searchValue"
      :nav-links="localizedNavLinks"
      :brand="brandConstants"
      :search="searchDefaults"
      :locale="localePack"
      :bell-badge="false"
      @logo-click="onLogoClick"
      @nav-click="onNavClick"
      @search="onSearch"
      @locale-click="onLocaleClick"
      @bell-click="onBellClick"
      @upload-click="onUploadClick"
      @avatar-click="onAvatarClick"
    />

    <div class="ss-pc__body">
      <UiPageTitle
        :title="t('settings.security.page.title')"
        :sub="[t('settings.security.page.subtitleA'), t('settings.security.page.subtitleB')]"
      />

      <!-- ───── § 01 修改密码 ───── -->
      <section class="ss-pc__card">
        <header class="ss-pc__card-head">
          <span class="ss-pc__card-num">{{ t('settings.security.password.num') }}</span>
          <span class="ss-pc__card-name">{{ t('settings.security.password.name') }}</span>
          <span class="ss-pc__card-stamp">{{ t('settings.security.password.stamp') }}</span>
        </header>
        <div class="ss-pc__card-body">
          <p class="ss-pc__hint">{{ t('settings.security.password.newPlaceholder') }}</p>
          <div class="ss-pc__cta">
            <UiButton
              variant="primary"
              :badge="t('settings.security.password.stamp')"
              data-test="ss-pw-open"
              @click="openPwDialog"
            >
              {{ t('settings.security.password.change') }}
            </UiButton>
          </div>
        </div>
      </section>

      <!-- ───── § 02 已登录设备 ───── -->
      <section class="ss-pc__card">
        <header class="ss-pc__card-head">
          <span class="ss-pc__card-num">{{ t('settings.security.sessions.num') }}</span>
          <span class="ss-pc__card-name">{{ t('settings.security.sessions.name') }}</span>
          <span class="ss-pc__card-stamp">{{ t('settings.security.sessions.stamp') }}</span>
        </header>
        <div class="ss-pc__card-body">
          <PcSessionList
            :sessions="sessions"
            :loading="loadingSessions"
            @revoke="onRevoke"
            @revoke-others="onRevokeOthers"
          />
          <div v-if="sessions.length > 1" class="ss-pc__cta">
            <el-popconfirm
              :title="t('settings.security.sessions.confirmRevokeOthers')"
              :confirm-button-text="t('settings.security.sessions.revokeOthers')"
              :cancel-button-text="t('settings.security.password.cancelCta')"
              width="240"
              @confirm="onRevokeOthers"
            >
              <template #reference>
                <button
                  type="button"
                  class="ss-pc__danger-btn"
                  data-test="ss-revoke-others"
                >
                  {{ t('settings.security.sessions.revokeOthers') }}
                </button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </section>
    </div>

    <PcFooter v-if="false" />

    <!-- ───── 修改密码 ElDialog ───── -->
    <el-dialog
      v-model="pwOpen"
      :title="t('settings.security.password.title')"
      width="440"
      align-center
      destroy-on-close
      :close-on-click-modal="false"
      :append-to-body="false"
    >
      <div data-test="ss-pw-dialog" class="ss-pw">
        <el-form
          label-position="top"
          @submit.prevent="submitPw"
        >
          <el-form-item
            :label="t('settings.security.password.oldLabel')"
            :error="pwErrors.old ? t('settings.security.password.oldHelperRequired') : ''"
          >
            <el-input
              v-model="pwForm.old"
              type="password"
              :placeholder="t('settings.security.password.oldPlaceholder')"
              show-password
              data-test="ss-pw-old"
            />
          </el-form-item>
          <el-form-item
            :label="t('settings.security.password.newLabel')"
            :error="pwErrors.next ? t('settings.security.password.newHelperWeak') : ''"
          >
            <el-input
              v-model="pwForm.next"
              type="password"
              :placeholder="t('settings.security.password.newPlaceholder')"
              show-password
              data-test="ss-pw-new"
            />
          </el-form-item>
          <el-form-item
            :label="t('settings.security.password.confirmLabel')"
            :error="pwErrors.confirm ? t('settings.security.password.confirmHelperNoMatch') : ''"
          >
            <el-input
              v-model="pwForm.confirm"
              type="password"
              :placeholder="t('settings.security.password.confirmPlaceholder')"
              show-password
              data-test="ss-pw-confirm"
            />
          </el-form-item>

          <div v-if="strength > 0" class="ss-pw__strength" :data-strength="strength">
            <span class="ss-pw__strength-label">{{ t('settings.security.password.strengthLabel') }}</span>
            <span class="ss-pw__strength-bar">
              <i v-for="i in 4" :key="i" :class="{ 'is-on': i <= strength }" />
            </span>
            <span class="ss-pw__strength-value">{{ strengthLabel }}</span>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="ss-pw__footer">
          <button
            type="button"
            class="ss-pw__btn ss-pw__btn--ghost"
            :disabled="submittingPw"
            data-test="ss-pw-cancel"
            @click="closePwDialog"
          >
            {{ t('settings.security.password.cancelCta') }}
          </button>
          <button
            type="button"
            class="ss-pw__btn ss-pw__btn--primary"
            :disabled="submittingPw"
            data-test="ss-pw-submit"
            @click="submitPw"
          >
            {{ t('settings.security.password.submitCta') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ss-pc {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}

.ss-pc__body {
  width: 960px;
  max-width: 100%;
  margin: var(--space-24) auto var(--space-32);
  padding: 0 var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.ss-pc__card {
  background: var(--paper);
  border: 1.5px solid var(--ink);
}
.ss-pc__card-head {
  background: var(--ink);
  color: var(--paper);
  padding: var(--space-8) var(--space-14);
  display: flex;
  align-items: baseline;
  gap: var(--space-10);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ss-pc__card-num {
  color: var(--hilite);
  font-weight: 700;
}
.ss-pc__card-name {
  color: var(--paper);
  font-weight: 700;
  flex: 1;
}
.ss-pc__card-stamp {
  color: var(--paper);
  border: 1px solid var(--paper);
  padding: 1px var(--space-6);
  font-size: var(--text-9);
}

.ss-pc__card-body {
  padding: var(--space-14);
}

.ss-pc__hint {
  margin: 0 0 var(--space-12);
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-2);
  letter-spacing: 0.04em;
}

.ss-pc__cta {
  display: flex;
  justify-content: flex-start;
  gap: var(--space-10);
  margin-top: var(--space-10);
}
.ss-pc__cta :deep(.ui-button) {
  width: auto;
  min-width: 200px;
}

.ss-pc__danger-btn {
  background: var(--paper);
  color: var(--semantic-warning);
  border: 1.5px solid var(--semantic-warning);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-13);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--space-8) var(--space-16);
  cursor: pointer;
  border-radius: var(--radius-none);
}
.ss-pc__danger-btn:hover { background: var(--paper-3); }
.ss-pc__danger-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>

<style>
/* ─── ElDialog inner customization (scoped 不命中 teleport) ─── */
.ss-pw {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}
.ss-pw__strength {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ss-pw__strength-bar {
  display: inline-flex;
  gap: var(--space-2);
}
.ss-pw__strength-bar i {
  display: inline-block;
  width: 22px;
  height: 4px;
  background: var(--paper-3);
  border: 1px solid var(--ink);
}
.ss-pw__strength-bar i.is-on { background: var(--hilite); }
.ss-pw__strength[data-strength='1'] .ss-pw__strength-value { color: var(--semantic-warning); }
.ss-pw__strength[data-strength='4'] .ss-pw__strength-value { color: var(--semantic-success); }

.ss-pw__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-10);
}
.ss-pw__btn {
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
.ss-pw__btn--primary {
  background: var(--hilite);
  color: var(--ink);
}
.ss-pw__btn--primary:hover { box-shadow: var(--glow-accent-md); }
.ss-pw__btn--ghost {
  background: var(--paper);
  color: var(--ink);
}
.ss-pw__btn--ghost:hover { background: var(--paper-3); }
.ss-pw__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ss-pw__btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
