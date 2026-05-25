/**
 * utils/passwordPolicy — 客户端密码强度校验
 *
 * 对齐 user-auth §6.5 / 错误码 10003（密码强度不足，请至少 8 位）。
 * 服务端 BCrypt + 锁定逻辑兜底；前端只做"够长 + 至少 1 字母 + 1 数字"早返。
 *
 * scorePassword:
 *   0  empty
 *   1  weak     < MIN
 *   2  fair     ≥ MIN but letters-only / digits-only
 *   3  good     ≥ MIN mixed letters + digits
 *   4  strong   ≥ MIN+2 mixed + at least 1 symbol
 *
 * validatePassword:
 *   { ok: true } | { ok: false, reason: 'required'|'tooShort'|'noLetter'|'noDigit' }
 */

export const MIN_PASSWORD_LENGTH = 8

const LETTER_RE = /[a-zA-Z]/
const DIGIT_RE = /\d/
const SYMBOL_RE = /[^a-zA-Z\d]/

export const scorePassword = (pw) => {
  if (pw === null || pw === undefined || pw === '') return 0
  const s = String(pw)
  if (s.length < MIN_PASSWORD_LENGTH) return 1
  const hasLetter = LETTER_RE.test(s)
  const hasDigit = DIGIT_RE.test(s)
  const hasSymbol = SYMBOL_RE.test(s)
  if (hasLetter && hasDigit && hasSymbol && s.length >= MIN_PASSWORD_LENGTH + 2) return 4
  if (hasLetter && hasDigit) return 3
  return 2 // letters-only or digits-only at ≥ MIN
}

export const validatePassword = (pw, { min = MIN_PASSWORD_LENGTH } = {}) => {
  if (pw === null || pw === undefined || pw === '') {
    return { ok: false, reason: 'required' }
  }
  const s = String(pw)
  if (s.length < min) return { ok: false, reason: 'tooShort' }
  if (!LETTER_RE.test(s)) return { ok: false, reason: 'noLetter' }
  if (!DIGIT_RE.test(s)) return { ok: false, reason: 'noDigit' }
  return { ok: true }
}
