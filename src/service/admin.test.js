import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import axios from '@/utils/axios'
import { getUserInfo } from '@/service/user'
import { loginByPassword, login, logout } from '@/service/auth'
import {
  getDashboard, listPosts, offlinePost,
  listUsers, banUser, unbanUser, listOrders,
  getUserDetail, setUserRoles, revokeAllSessions, listLoginEvents
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
  it('banUser PUT /admin/users/{id}/ban with reason+untilAt', () => {
    banUser(5, { reason: 'spam', untilAt: '2026-12-31T00:00:00Z' })
    expect(axios.put).toHaveBeenCalledWith('/admin/users/5/ban', { reason: 'spam', untilAt: '2026-12-31T00:00:00Z' })
  })
  it('banUser 兼容旧调用 (无 body)', () => {
    banUser(5)
    expect(axios.put).toHaveBeenCalledWith('/admin/users/5/ban', {})
  })
  it('unbanUser PUT /admin/users/{id}/unban', () => {
    unbanUser(5)
    expect(axios.put).toHaveBeenCalledWith('/admin/users/5/unban')
  })
  it('listUsers GET /admin/users with params', () => {
    listUsers({ keyword: 'l', status: 'NORMAL', role: 'admin', page: 1, size: 20 })
    expect(axios.get).toHaveBeenCalledWith('/admin/users', {
      params: { keyword: 'l', status: 'NORMAL', role: 'admin', page: 1, size: 20 }
    })
  })
  it('listUsers 无参时仍传空 params', () => {
    listUsers()
    expect(axios.get).toHaveBeenCalledWith('/admin/users', { params: {} })
  })
  it('listOrders GET /admin/orders', () => {
    listOrders()
    expect(axios.get).toHaveBeenCalledWith('/admin/orders', { params: {} })
  })

  // ---- P4 新增：用户详情 / 角色编辑 / 强制下线 / 登录审计 ----
  it('getUserDetail GET /admin/users/{id}', () => {
    getUserDetail(7)
    expect(axios.get).toHaveBeenCalledWith('/admin/users/7')
  })
  it('setUserRoles PUT /admin/users/{id}/roles with add/remove', () => {
    setUserRoles(7, { add: ['admin'], remove: ['user'] })
    expect(axios.put).toHaveBeenCalledWith('/admin/users/7/roles', { add: ['admin'], remove: ['user'] })
  })
  it('revokeAllSessions POST /admin/users/{id}/sessions/revoke-all', () => {
    revokeAllSessions(7)
    expect(axios.post).toHaveBeenCalledWith('/admin/users/7/sessions/revoke-all')
  })
  it('listLoginEvents GET /admin/audit/login-events with params', () => {
    listLoginEvents({ userId: 1, type: 'LOGIN_FAIL', from: 't1', to: 't2', deviceType: 'pc', page: 1, size: 20 })
    expect(axios.get).toHaveBeenCalledWith('/admin/audit/login-events', {
      params: { userId: 1, type: 'LOGIN_FAIL', from: 't1', to: 't2', deviceType: 'pc', page: 1, size: 20 }
    })
  })
  it('listLoginEvents 无参时仍传空 params', () => {
    listLoginEvents()
    expect(axios.get).toHaveBeenCalledWith('/admin/audit/login-events', { params: {} })
  })
})

describe('service/model — 模型库接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getModelLibrary GET /model/library', () => {
    getModelLibrary()
    expect(axios.get).toHaveBeenCalledWith('/model/library')
  })
})
