/**
 * service/mfa — PC 端两步验证（TOTP）接口集中 (user-auth P6)
 *
 * 同源副本对齐：fab-3d-world-web/src/service/mfa.js（如 web 后续增）
 * Spec：docs/user-auth-impl.md §11 P6（双端共享 endpoint 契约）
 *
 * 端点对照：
 *   setup()                            POST /mfa/setup            ⇒ {secret, qrUrl}
 *   verifySetup(code)                  POST /mfa/verify-setup     ⇒ {recoveryCodes:[10]}
 *   verify(code)                       POST /mfa/verify           ⇒ {ok:true}
 *   disable(password, code)            POST /mfa/disable
 *   status()                           GET  /mfa/status           ⇒ {enabled, recoveryRemaining}
 *   regenerateRecoveryCodes(code)      POST /mfa/recovery-codes   ⇒ {recoveryCodes:[10]}
 */
import axios from '../utils/axios'

export const setup = () => axios.post('/mfa/setup')
export const verifySetup = (code) => axios.post('/mfa/verify-setup', { code })
export const verify = (code) => axios.post('/mfa/verify', { code })
export const disable = (password, code) => axios.post('/mfa/disable', { password, code })
export const status = () => axios.get('/mfa/status')
export const regenerateRecoveryCodes = (code) =>
  axios.post('/mfa/recovery-codes', { code })
