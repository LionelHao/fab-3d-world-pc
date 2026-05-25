/**
 * stores/user — 用户登录态（PC 端）
 *
 * 命名空间：`fab.pc.*` localStorage key（与 Web 端 `fab.web.*` 同构）
 *   - fab.pc.token     —— Sa-Token 值
 *   - fab.pc.user      —— UserDto JSON（含 roles）
 *   - fab.pc.expireAt  —— 绝对过期时间戳（ms）
 *
 * 旧 key 迁移：首次启动时把 `pc_token` / `pc_userInfo` 搬到新 key 后清除。
 *
 * **web + pc 各一份同源副本，命名空间常量 NS + 旧 key 名 不同**。
 * 双端 getters / actions 字段对齐。
 */
import { defineStore } from 'pinia'

const NS = 'fab.pc'
const KEY_TOKEN = `${NS}.token`
const KEY_USER = `${NS}.user`
const KEY_EXPIRE = `${NS}.expireAt`

/** 首次启动迁移旧 key（无 expireAt → 置 0，下次请求会触发 refresh 验证） */
function migrateLegacy() {
  if (typeof localStorage === 'undefined') return
  const oldToken = localStorage.getItem('pc_token')
  const oldUser = localStorage.getItem('pc_userInfo')
  if (oldToken && !localStorage.getItem(KEY_TOKEN)) {
    localStorage.setItem(KEY_TOKEN, oldToken)
    if (oldUser) localStorage.setItem(KEY_USER, oldUser)
    localStorage.setItem(KEY_EXPIRE, '0')
  }
  // 不论搬没搬，旧 key 都清除（避免下次启动重复 migrate）
  localStorage.removeItem('pc_token')
  localStorage.removeItem('pc_userInfo')
}
migrateLegacy()

function parseUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY_USER) || 'null')
  } catch {
    return null
  }
}

function toMs(expireAt) {
  if (typeof expireAt === 'number') return expireAt
  if (!expireAt) return 0
  const parsed = new Date(expireAt).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * 抽取用户的 role 列表 — 兼容 `user.roles[]` 新字段与 `user.role` 旧字符串字段。
 * 旧字段（迁移期）：登录返回过 `{ role: 'creator' }` 这种 shape。
 * 返回值：array of role code strings（可能为空数组）。
 */
function extractRoles(user) {
  if (!user) return []
  if (Array.isArray(user.roles)) return user.roles
  if (typeof user.role === 'string' && user.role) return [user.role]
  return []
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(KEY_TOKEN) || '',
    expireAt: Number(localStorage.getItem(KEY_EXPIRE)) || 0,
    user: parseUser(),
  }),

  getters: {
    /** expireAt=0 视为未知（legacy），仍认为登录态有效，让 axios 拦截器去验证 */
    isLoggedIn: (s) => !!s.token && (!s.expireAt || s.expireAt > Date.now()),
    /** 抽出 roles 数组（兼容 legacy `user.role` 单字符串字段） */
    roles: (s) => extractRoles(s.user),
    hasRole(s) {
      return (role) => extractRoles(s.user).includes(role)
    },
    hasAnyRole(s) {
      return (rolesArg) => {
        if (!Array.isArray(rolesArg) || rolesArg.length === 0) return false
        const owned = extractRoles(s.user)
        return rolesArg.some((r) => owned.includes(r))
      }
    },
    isAdmin: (s) => {
      const owned = extractRoles(s.user)
      return owned.includes('admin') || owned.includes('super_admin')
    },
    isSuperAdmin: (s) => extractRoles(s.user).includes('super_admin'),
    isModerator: (s) => extractRoles(s.user).includes('moderator'),
    isCreator: (s) => extractRoles(s.user).includes('creator'),
    isVerifiedUser: (s) => extractRoles(s.user).includes('verified_user'),
    userId: (s) => s.user?.userId ?? s.user?.id ?? '',
    nickname: (s) => s.user?.nickname || s.user?.username || '',
    /** OAuth 绑定列表，登录响应 user.bindings 字段；无字段时空数组 */
    bindings: (s) => (Array.isArray(s.user?.bindings) ? s.user.bindings : []),
  },

  actions: {
    login(token, user, expireAt) {
      this.token = token
      this.user = user
      this.expireAt = toMs(expireAt)
      localStorage.setItem(KEY_TOKEN, token)
      localStorage.setItem(KEY_USER, JSON.stringify(user))
      localStorage.setItem(KEY_EXPIRE, String(this.expireAt))
    },
    updateToken(token, expireAt) {
      this.token = token
      this.expireAt = toMs(expireAt)
      localStorage.setItem(KEY_TOKEN, token)
      localStorage.setItem(KEY_EXPIRE, String(this.expireAt))
    },
    updateUser(user) {
      this.user = user
      localStorage.setItem(KEY_USER, JSON.stringify(user))
    },
    /** 仅刷新 user.bindings；user 为空时 noop（OAuth 绑定/解绑后调） */
    setBindings(bindings) {
      if (!this.user) return
      const next = { ...this.user, bindings: Array.isArray(bindings) ? bindings : [] }
      this.user = next
      localStorage.setItem(KEY_USER, JSON.stringify(next))
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
