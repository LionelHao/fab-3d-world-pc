/**
 * service/captcha — PC 端人机验证接口 (user-auth P6)
 *
 * 同源副本对齐：fab-3d-world-web/src/service/captcha.js（如 web 后续增）
 * Spec：docs/user-auth-impl.md §11 P6
 *
 * 端点对照：
 *   getConfig(scene)   GET  /captcha/config?scene=<scene>  ⇒ {provider, siteKey, required}
 *   verify(payload)    POST /captcha/verify               ⇒ {ok}
 *
 * provider：'mock' | 'hcaptcha' | 'turnstile'（mock dev 友好；prod 走真 provider）
  * @spec docs/design/user-auth/01-architecture.md#11
 * @capability user-auth.mfa-totp
 * @since P6
 */
import axios from '../utils/axios'

export const getConfig = (scene) =>
  axios.get('/captcha/config', { params: { scene } })

export const verify = (payload) => axios.post('/captcha/verify', payload)
