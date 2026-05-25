/**
 * utils/passwordPolicy — 单元测试
 *
 * 客户端密码强度校验（user-auth 总体方案 §6.5 / 错误码 10003：≥8 位）。
 * 服务端 BCrypt 兜底；前端只做"够长 + 至少 1 字母 + 1 数字"。
 */
import { describe, it, expect } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  scorePassword,
  validatePassword
} from '@/utils/passwordPolicy'

describe('utils/passwordPolicy — MIN_PASSWORD_LENGTH', () => {
  it('exposes minimum length = 8 (aligns with auth.biz.10003)', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
  })
})

describe('utils/passwordPolicy — scorePassword', () => {
  it('returns 0 for empty / null / undefined', () => {
    expect(scorePassword('')).toBe(0)
    expect(scorePassword(null)).toBe(0)
    expect(scorePassword(undefined)).toBe(0)
  })

  it('returns 1 (weak) for password shorter than min length', () => {
    expect(scorePassword('abc12')).toBe(1)
  })

  it('returns 2 (fair) for ≥8 chars with letters only OR digits only', () => {
    expect(scorePassword('abcdefgh')).toBe(2)
    expect(scorePassword('12345678')).toBe(2)
  })

  it('returns 3 (good) for ≥8 chars mixed letters + digits', () => {
    expect(scorePassword('abcd1234')).toBe(3)
  })

  it('returns 4 (strong) for ≥10 chars mixed + symbol', () => {
    expect(scorePassword('Abcd1234!@')).toBe(4)
  })
})

describe('utils/passwordPolicy — validatePassword', () => {
  it('rejects empty / null', () => {
    expect(validatePassword('')).toEqual({ ok: false, reason: 'required' })
    expect(validatePassword(null)).toEqual({ ok: false, reason: 'required' })
  })

  it('rejects shorter than MIN_PASSWORD_LENGTH', () => {
    expect(validatePassword('a1b2')).toEqual({ ok: false, reason: 'tooShort' })
  })

  it('rejects letters-only when long enough (must mix)', () => {
    expect(validatePassword('abcdefgh')).toEqual({ ok: false, reason: 'noDigit' })
  })

  it('rejects digits-only when long enough (must mix)', () => {
    expect(validatePassword('12345678')).toEqual({ ok: false, reason: 'noLetter' })
  })

  it('accepts ≥8 chars with at least 1 letter + 1 digit', () => {
    expect(validatePassword('abcd1234')).toEqual({ ok: true })
    expect(validatePassword('Pass1234')).toEqual({ ok: true })
  })

  it('respects custom min option', () => {
    expect(validatePassword('a1b2c3', { min: 6 })).toEqual({ ok: true })
    expect(validatePassword('a1b2c3')).toEqual({ ok: false, reason: 'tooShort' })
  })
})
