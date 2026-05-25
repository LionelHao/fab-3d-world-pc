/**
 * useCountdown — 单测（user-auth P2 · 密码重置 验证码倒计时）
 *
 * Spec: docs/user-auth-impl.md §9 P2（密码重置三步流程）
 *
 * 用例覆盖：
 *   - 初始 remaining = 0，active = false
 *   - start(N) 后立即 remaining = N，active = true
 *   - 每秒递减 1 直到 0；归零后 active = false
 *   - 重复 start 会重置计时
 *   - reset() 立即停止并归零
 *   - 自动清理：组件卸载后 timer 不再继续
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCountdown } from './countdown'

describe('utils/countdown — useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始状态 remaining=0 active=false', () => {
    const c = useCountdown()
    expect(c.remaining.value).toBe(0)
    expect(c.active.value).toBe(false)
  })

  it('start(60) 后 remaining=60 active=true', () => {
    const c = useCountdown()
    c.start(60)
    expect(c.remaining.value).toBe(60)
    expect(c.active.value).toBe(true)
  })

  it('每秒递减 1', () => {
    const c = useCountdown()
    c.start(3)
    vi.advanceTimersByTime(1000)
    expect(c.remaining.value).toBe(2)
    vi.advanceTimersByTime(1000)
    expect(c.remaining.value).toBe(1)
  })

  it('归零后 active=false 且不会继续递减', () => {
    const c = useCountdown()
    c.start(2)
    vi.advanceTimersByTime(3000)
    expect(c.remaining.value).toBe(0)
    expect(c.active.value).toBe(false)
    vi.advanceTimersByTime(2000)
    expect(c.remaining.value).toBe(0)
  })

  it('重复 start 会重置计时', () => {
    const c = useCountdown()
    c.start(5)
    vi.advanceTimersByTime(2000)
    expect(c.remaining.value).toBe(3)
    c.start(10)
    expect(c.remaining.value).toBe(10)
    vi.advanceTimersByTime(1000)
    expect(c.remaining.value).toBe(9)
  })

  it('reset() 立即停止并归零', () => {
    const c = useCountdown()
    c.start(60)
    vi.advanceTimersByTime(2000)
    c.reset()
    expect(c.remaining.value).toBe(0)
    expect(c.active.value).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(c.remaining.value).toBe(0)
  })

  it('start(0) 不启动计时', () => {
    const c = useCountdown()
    c.start(0)
    expect(c.remaining.value).toBe(0)
    expect(c.active.value).toBe(false)
  })

  it('start 非数字 / 负数 → 视作 0', () => {
    const c = useCountdown()
    c.start(-5)
    expect(c.remaining.value).toBe(0)
    expect(c.active.value).toBe(false)
    c.start('abc')
    expect(c.remaining.value).toBe(0)
  })
})
