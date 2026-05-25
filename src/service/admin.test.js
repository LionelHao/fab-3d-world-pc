import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import axios from '@/utils/axios'
import { getUserInfo } from '@/service/user'
import { loginByPassword, login, logout } from '@/service/auth'
import {
  getDashboard, listPosts, offlinePost,
  listUsers, banUser, unbanUser, listOrders
} from '@/service/admin'
import { getModelLibrary } from '@/service/model'

describe('service/user — 账号接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getUserInfo GET /user/info', () => {
    getUserInfo()
    expect(axios.get).toHaveBeenCalledWith('/user/info')
  })
})

describe('service/auth — 认证接口契约 (兼容性 smoke)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loginByPassword POST /auth/login/password', () => {
    loginByPassword({ identifier: 'u', password: 'p' })
    expect(axios.post).toHaveBeenCalledWith('/auth/login/password', { identifier: 'u', password: 'p' })
  })

  it('login 是 loginByPassword 别名', () => {
    expect(login).toBe(loginByPassword)
  })

  it('logout POST /auth/logout', () => {
    logout()
    expect(axios.post).toHaveBeenCalledWith('/auth/logout')
  })
})

describe('service/admin — 运营后台接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getDashboard GET /admin/dashboard', () => {
    getDashboard()
    expect(axios.get).toHaveBeenCalledWith('/admin/dashboard')
  })
  it('listPosts GET /admin/posts', () => {
    listPosts()
    expect(axios.get).toHaveBeenCalledWith('/admin/posts')
  })
  it('offlinePost PUT /admin/posts/{id}/offline', () => {
    offlinePost(3)
    expect(axios.put).toHaveBeenCalledWith('/admin/posts/3/offline')
  })
  it('banUser PUT /admin/users/{id}/ban', () => {
    banUser(5)
    expect(axios.put).toHaveBeenCalledWith('/admin/users/5/ban')
  })
  it('unbanUser PUT /admin/users/{id}/unban', () => {
    unbanUser(5)
    expect(axios.put).toHaveBeenCalledWith('/admin/users/5/unban')
  })
  it('listUsers GET /admin/users', () => {
    listUsers()
    expect(axios.get).toHaveBeenCalledWith('/admin/users')
  })
  it('listOrders GET /admin/orders', () => {
    listOrders()
    expect(axios.get).toHaveBeenCalledWith('/admin/orders', { params: {} })
  })
})

describe('service/model — 模型库接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getModelLibrary GET /model/library', () => {
    getModelLibrary()
    expect(axios.get).toHaveBeenCalledWith('/model/library')
  })
})
