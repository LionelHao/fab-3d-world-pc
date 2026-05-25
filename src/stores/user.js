import { defineStore } from 'pinia'

/**
 * 用户鉴权 store —— PC Web 端登录态唯一来源
 *
 * 命名空间：fab.pc.* (与 Web 端 fab.web.* 对齐)
 * 持久化：localStorage (token / user / expireAt)
 *
 * Spec：docs/user-auth-impl.md §1.1 + 总体方案 §5.4
 * 同源副本对齐：fab-3d-world-web/src/stores/user.js (NS 不同 / 字段一致)
 */

const NS = 'fab.pc'
const KEY_TOKEN = `${NS}.token`
const KEY_USER = `${NS}.user`
const KEY_EXPIRE = `${NS}.expireAt`

/**
 * 旧 key 兼容迁移（首次启动时执行一次）
 * 旧 pc_token / pc_userInfo (Phase 0 命名) → 新 fab.pc.* (P1 user-auth)
 */
function migrateLegacy() {
  const oldToken = localStorage.getItem('pc_token')
  const oldUser = localStorage.getItem('pc_userInfo')
  if (oldToken && !localStorage.getItem(KEY_TOKEN)) {
    localStorage.setItem(KEY_TOKEN, oldToken)
    if (oldUser) localStorage.setItem(KEY_USER, oldUser)
    // 老数据无 expireAt，置 0 → 下一次请求由 refresh 拦截器接管验证
    localStorage.setItem(KEY_EXPIRE, '0')
  }
  // 旧 key 清掉，避免堆积
  localStorage.removeItem('pc_token')
  localStorage.removeItem('pc_userInfo')
}
migrateLegacy()

function parseUser(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeExpireAt(value) {
  if (typeof value === 'number') return value
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(KEY_TOKEN) || '',
    expireAt: Number(localStorage.getItem(KEY_EXPIRE)) || 0,
    user: parseUser(localStorage.getItem(KEY_USER)),
  }),

  getters: {
    /**
     * 已登录：有 token 且 (无 expireAt 或 expireAt 未过期)
     * expireAt = 0 视作未知（迁移过来的老 token），允许通过 → 由 refresh 拦截器兜底
     */
    isLoggedIn: (s) => !!s.token && (!s.expireAt || s.expireAt > Date.now()),

    /**
     * 是否管理员：roles 包含 admin 或 super_admin
     */
    isAdmin: (s) =>
      Array.isArray(s.user?.roles) &&
      (s.user.roles.includes('admin') || s.user.roles.includes('super_admin')),

    /**
     * hasRole(roleCode) — 通用角色判断
     */
    hasRole: (s) => (role) => Array.isArray(s.user?.roles) && s.user.roles.includes(role),

    userId: (s) => s.user?.userId ?? s.user?.id ?? '',

    nickname: (s) => s.user?.nickname || s.user?.username || '',
  },

  actions: {
    login(token, user, expireAt) {
      this.token = token
      this.user = user || null
      this.expireAt = normalizeExpireAt(expireAt)
      localStorage.setItem(KEY_TOKEN, token)
      localStorage.setItem(KEY_USER, JSON.stringify(user || null))
      localStorage.setItem(KEY_EXPIRE, String(this.expireAt))
    },
    updateToken(token, expireAt) {
      this.token = token
      this.expireAt = normalizeExpireAt(expireAt)
      localStorage.setItem(KEY_TOKEN, token)
      localStorage.setItem(KEY_EXPIRE, String(this.expireAt))
    },
    updateUser(user) {
      this.user = user || null
      localStorage.setItem(KEY_USER, JSON.stringify(user || null))
    },
    logout() {
      this.token = ''
      this.user = null
      this.expireAt = 0
      localStorage.removeItem(KEY_TOKEN)
      localStorage.removeItem(KEY_USER)
      localStorage.removeItem(KEY_EXPIRE)
    },
  },
})
