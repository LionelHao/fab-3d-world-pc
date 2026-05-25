/**
 * service/auth — PC 端用户认证域接口集中
 *
 * 同源副本对齐：fab-3d-world-web/src/service/auth.js
 * Spec：docs/user-auth-impl.md §1.5（与 Web impl §1.5 共享 endpoint 契约）
 *
 * user-info（资料 / 头像 / stat）归 `service/user.js` 占位（本期仅 getUserInfo）
 * + 未来 user-info 模块扩展。
 *
 * 命名 vs URL 对照：
 *   sendSms / sendEmail                   POST /auth/{sms,email}/send
 *   loginByPassword / loginByCode         POST /auth/login/{password,code}
 *   register                              POST /auth/signup
 *   logout                                POST /auth/logout
 *   refresh                               POST /auth/refresh
 *   changePassword                        POST /auth/password/change
 *   requestPasswordReset                  POST /auth/password/reset/request
 *   confirmPasswordReset                  POST /auth/password/reset/confirm
 *   listSessions                          GET  /auth/sessions
 *   revokeSession(tokenValue)             POST /auth/sessions/{tokenValue}/revoke
 *   revokeOtherSessions                   POST /auth/sessions/revoke-others
 *   oauthAuthorize(provider, params)      GET  /auth/oauth/{provider}/authorize
 *   oauthCallback(provider, payload)      POST /auth/oauth/{provider}/callback
 */
import axios from '../utils/axios'

/* ── 验证码 ── */
export const sendSms = (target, scene) => axios.post('/auth/sms/send', { target, scene })
export const sendEmail = (target, scene) => axios.post('/auth/email/send', { target, scene })

/* ── 登录 / 注册 / 登出 ── */
export const loginByPassword = (params) => axios.post('/auth/login/password', params)
export const loginByCode = (params) => axios.post('/auth/login/code', params)
export const register = (params) => axios.post('/auth/signup', params)
export const logout = () => axios.post('/auth/logout')

/** 旧接口兼容别名（1 期内可用，便于业务渐进迁移；2 期可删） */
export const login = loginByPassword

/* ── Token ── */
export const refresh = () => axios.post('/auth/refresh')

/* ── 密码 ── */
export const changePassword = (params) => axios.post('/auth/password/change', params)
export const requestPasswordReset = (target) =>
  axios.post('/auth/password/reset/request', { target })
export const confirmPasswordReset = (params) =>
  axios.post('/auth/password/reset/confirm', params)

/* ── 会话 / 设备 ── */
export const listSessions = () => axios.get('/auth/sessions')
export const revokeSession = (tokenValue) =>
  axios.post(`/auth/sessions/${tokenValue}/revoke`)
export const revokeOtherSessions = () => axios.post('/auth/sessions/revoke-others')

/* ── OAuth（P5） ── */
export const oauthAuthorize = (provider, params) =>
  axios.get(`/auth/oauth/${provider}/authorize`, { params })
export const oauthCallback = (provider, params) =>
  axios.post(`/auth/oauth/${provider}/callback`, params)
