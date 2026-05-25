/**
 * utils/axios — PC 端 HTTP 拦截器
 *
 * Spec：docs/user-auth-impl.md §1.2 + 总体方案 §5.1-5.2
 * 同源副本对齐：fab-3d-world-web/src/utils/axios.js
 * 唯一差异：DEVICE_TYPE = 'pc' + toast 通道 ElMessage
 *
 * 关键能力：
 * - 请求：携带 Bearer token + X-Device-Type: pc
 * - 请求：expireAt - now < 15min 自动 POST /auth/refresh 续约 (并发去重)
 * - 响应：code === 200 unwrap data
 * - 响应：登录/注册/oauth callback 端点自动 store.login
 * - 响应：code 419 / 401 → logout + 跳 /login?from=...
 * - 错误：ElMessage.error 渲染 i18n auth.error.<code>
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { t } from '@/i18n'
import router from '@/router'

const REFRESH_THRESHOLD_MS = 15 * 60 * 1000
const DEVICE_TYPE = 'pc'

const REFRESH_EXEMPT_PATTERN = /\/auth\/(refresh|login\/(password|code)|signup|oauth\/[^/]+\/callback)$/
const AUTO_LOGIN_PATTERN = /\/auth\/(login\/(password|code)|signup|oauth\/[^/]+\/callback)$/

/**
 * 用 axios.create 创建独立实例：避免污染全局 axios（影响 SDK / 测试）
 */
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})
instance.defaults.headers.post['Content-Type'] = 'application/json'

/** 全局 in-flight refresh promise，多请求并发只触发一次 refresh */
let refreshPromise = null

function isExemptFromRefresh(url) {
  return !!url && REFRESH_EXEMPT_PATTERN.test(url)
}

function isAutoLoginEndpoint(url) {
  return !!url && AUTO_LOGIN_PATTERN.test(url)
}

async function ensureFreshToken(url) {
  if (isExemptFromRefresh(url)) return

  const store = useUserStore()
  if (!store.token || !store.expireAt) return
  if (store.expireAt - Date.now() > REFRESH_THRESHOLD_MS) return

  if (!refreshPromise) {
    refreshPromise = instance
      .post('/auth/refresh')
      .then((data) => {
        // data 已被响应拦截器 unwrap 为 { token, expireAt }
        if (data && data.token) {
          store.updateToken(data.token, data.expireAt)
        }
      })
      .catch((err) => {
        store.logout()
        router.push({
          path: '/login',
          query: { from: router.currentRoute?.value?.fullPath || '/' },
        })
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  await refreshPromise
}

instance.interceptors.request.use(
  async (config) => {
    await ensureFreshToken(config.url)
    const token = useUserStore().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Device-Type'] = DEVICE_TYPE
    return config
  },
  (error) => Promise.reject(error),
)

instance.interceptors.response.use(
  (res) => {
    const body = res.data
    if (!body || typeof body !== 'object') {
      ElMessage.error(t('common.toast.serverError'))
      return Promise.reject(res)
    }

    if (body.code === 200) {
      // 登录类端点自动 store.login
      if (isAutoLoginEndpoint(res.config?.url) && body.data?.token) {
        const store = useUserStore()
        store.login(body.data.token, body.data.user, body.data.expireAt)
      }
      return body.data
    }

    // 业务错误分支：toast + 特定 code 跳登录
    const msg = t(`auth.error.${body.code}`, {
      msg: body.message || '',
      traceId: body.traceId || '',
    })
    ElMessage.error(msg)

    if (body.code === 419 || body.code === 401) {
      const store = useUserStore()
      store.logout()
      router.push({
        path: '/login',
        query: { from: router.currentRoute?.value?.fullPath || '/' },
      })
    }
    return Promise.reject(body)
  },
  (error) => {
    // 网络层 / 5xx 等真实 HTTP 错误
    if (error?.response?.status === 429) {
      ElMessage.error(t('auth.error.429'))
    } else if (!error?.response) {
      ElMessage.error(t('common.toast.networkError'))
    }
    return Promise.reject(error)
  },
)

export default instance
