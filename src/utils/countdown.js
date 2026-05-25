/**
 * useCountdown — 通用秒级倒计时 composable
 *
 * Spec: docs/user-auth-impl.md §9 P2（密码重置 三步流程 验证码倒计时）
 *
 * 设计：
 *   - remaining: Ref<number> 当前剩余秒数；归零自动停止
 *   - active: ComputedRef<boolean> remaining > 0
 *   - start(seconds): 重置并启动；非法值视作 0（不启动）
 *   - reset(): 立即停止 + 归零
 *
 * 使用场景：发送短信验证码后 60s 内禁用重发按钮。
 *
 * 调用方使用：
 *   const { remaining, active, start, reset } = useCountdown()
 *   onSend → start(60)
 *   onUnmounted → reset()  // composable 内 onScopeDispose 兜底
 */
import { ref, computed, onScopeDispose, getCurrentScope } from 'vue'

export function useCountdown() {
  const remaining = ref(0)
  const active = computed(() => remaining.value > 0)
  let timer = null

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function start(seconds) {
    const n = Number(seconds)
    clearTimer()
    if (!Number.isFinite(n) || n <= 0) {
      remaining.value = 0
      return
    }
    remaining.value = Math.floor(n)
    timer = setInterval(() => {
      if (remaining.value <= 1) {
        remaining.value = 0
        clearTimer()
      } else {
        remaining.value -= 1
      }
    }, 1000)
  }

  function reset() {
    clearTimer()
    remaining.value = 0
  }

  // 组件作用域内自动清理（避免 leak）；在测试中 getCurrentScope === undefined
  if (getCurrentScope()) {
    onScopeDispose(clearTimer)
  }

  return { remaining, active, start, reset }
}
