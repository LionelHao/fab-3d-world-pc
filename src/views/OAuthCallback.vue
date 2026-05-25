<script setup>
/**
 * OAuthCallback (PC) — OAuth provider 重定向回调（user-auth P5）
 *
 * Spec: docs/user-auth-impl.md §5 + 总体方案 §5.3 / §11 P5
 *
 * 路由：/oauth/callback/:provider
 *
 * 行为：
 *   - 解析 route.params.provider + route.query.{code, state, action?}
 *   - action='bind'：调 POST /auth/oauth/{p}/bind → push /settings/security
 *   - action 缺省：调 POST /auth/oauth/{p}/callback → push /home
 *     （axios 拦截器在 callback 端点自动写 store.login，详见 utils/axios.js §AUTO_LOGIN_PATTERN）
 *   - 缺 code/state/provider → toast stateMismatch + push /login
 *   - 接口拒绝 → toast 业务错误 + push /login?oauth_error=<code>
 *
 * UI：极简「Signing in…」占位，不做炫技 spinner（实际只显示 1~2s）。
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { oauthCallback, oauthBind } from '@/service/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isBind = route.query?.action === 'bind'
const loadingLabel = computed(() =>
  isBind ? t('auth.oauth.callback.bindLoading') : t('auth.oauth.callback.loading'),
)

const finished = ref(false)

async function run() {
  const provider = route.params?.provider
  const code = route.query?.code
  const state = route.query?.state

  if (!provider || !code || !state) {
    ElMessage.error(t('auth.oauth.errors.stateMismatch'))
    finished.value = true
    await router.replace({ path: '/login', query: { oauth_error: 'state_mismatch' } })
    return
  }

  try {
    if (isBind) {
      await oauthBind(provider, { code, state })
      ElMessage.success(
        t('auth.oauth.bindSuccess', { provider: t(`auth.oauth.providers.${shortProviderKey(provider)}`) }),
      )
      finished.value = true
      await router.replace('/settings/security')
      return
    }

    await oauthCallback(provider, { code, state, deviceType: 'pc' })
    // 拦截器已写 store.login；这里仅跳转
    finished.value = true
    await router.replace('/home')
  } catch (err) {
    const code = err?.code
    let msgKey = 'auth.oauth.errors.unknown'
    if (code === 10301) msgKey = 'auth.oauth.errors.bindingConflict'
    ElMessage.error(t(msgKey))
    finished.value = true
    if (isBind) {
      await router.replace('/settings/security')
    } else {
      await router.replace({
        path: '/login',
        query: { oauth_error: String(code || 'unknown') },
      })
    }
  }
}

/** provider id 转 i18n key（wechat-mp → wechatMp, 其他 lower） */
function shortProviderKey(provider) {
  if (!provider) return ''
  if (provider === 'wechat-mp' || provider === 'wechat-mobile') return 'wechatMp'
  return provider
}

onMounted(run)
</script>

<template>
  <div class="pc-oauth-cb">
    <div class="pc-oauth-cb__card" data-test="oauth-cb-loading">
      <span class="pc-oauth-cb__label">{{ loadingLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.pc-oauth-cb {
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pc-oauth-cb__card {
  border: 1.5px solid var(--ink);
  background: var(--paper-2);
  padding: var(--space-20) var(--space-32);
  font-family: var(--f-mono);
  font-size: var(--text-12);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
  border-radius: var(--radius-none);
}
.pc-oauth-cb__label {
  display: inline-block;
}
</style>
