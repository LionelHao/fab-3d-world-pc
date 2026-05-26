/**
 * service/security — PC 端安全预警接口 (user-auth P6)
 *
 * 同源副本对齐：fab-3d-world-web/src/service/security.js（如 web 后续增）
 * Spec：docs/user-auth-impl.md §11 P6
 *
 * 端点对照：
 *   listAlerts(filter?)   GET  /user/security/alerts        ⇒ Array<AlertEvent>
 *   acknowledgeAlert(id)  POST /user/security/alerts/{id}/ack
 *
 * AlertEvent shape: { id, time, location, device, ip, ownership: 'self'|'unknown', userAgent? }
  * @spec docs/design/user-auth/01-architecture.md#11
 * @capability user-auth.mfa-totp
 * @since P6
 */
import axios from '../utils/axios'

export const listAlerts = (filter) =>
  axios.get('/user/security/alerts', { params: filter || undefined })

export const acknowledgeAlert = (id) =>
  axios.post(`/user/security/alerts/${id}/ack`)
