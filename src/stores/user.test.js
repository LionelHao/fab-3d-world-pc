import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('stores/user — PC 端用户鉴权', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('初始未登录', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('login 写入 token 与用户信息并持久化', () => {
    const store = useUserStore()
    store.login('tk-1', { id: 1, nickname: 'lionel', role: 'user' })
    expect(store.isLoggedIn).toBe(true)
    expect(localStorage.getItem('pc_token')).toBe('tk-1')
  })

  it('isAdmin 在角色为 admin 时为 true', () => {
    const store = useUserStore()
    store.login('tk-1', { id: 1, role: 'admin' })
    expect(store.isAdmin).toBe(true)
  })

  it('logout 清空状态与本地存储', () => {
    const store = useUserStore()
    store.login('tk-1', { id: 1 })
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(localStorage.getItem('pc_token')).toBeNull()
  })
})
