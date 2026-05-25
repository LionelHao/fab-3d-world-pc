import axios from '../utils/axios'

/**
 * service/admin — Ops Console 后台接口
 *
 * Spec: docs/design/user-auth/01-architecture.md §11 P4 + docs/user-auth-impl.md §1.5
 * 同源对等: 与 web 端的 admin service 字段一致（PC 暴露更多入口）
 *
 * 端点矩阵：
 *  - GET    /admin/dashboard
 *  - GET    /admin/users                                ?keyword&status&role&page&size
 *  - GET    /admin/users/{id}
 *  - PUT    /admin/users/{id}/ban                        { reason, untilAt? }
 *  - PUT    /admin/users/{id}/unban
 *  - PUT    /admin/users/{id}/roles                      { add, remove }              super_admin
 *  - POST   /admin/users/{id}/sessions/revoke-all
 *  - GET    /admin/audit/login-events                    ?userId&type&from&to&deviceType&page&size
 *  - GET    /admin/posts                  PUT /admin/posts/{id}/offline
 *  - GET    /admin/orders                 ?status
 */

/** 数据看板统计 */
export const getDashboard = () => axios.get('/admin/dashboard')

/* ---------------- 用户管理（auth 字段为主） ---------------- */

/**
 * 用户列表分页查询
 * @param {{keyword?:string,status?:string,role?:string,page?:number,size?:number}} [params]
 */
export const listUsers = (params = {}) => axios.get('/admin/users', { params })

/** 用户详情 (含 events / sessions count) */
export const getUserDetail = (id) => axios.get(`/admin/users/${id}`)

/**
 * 封禁用户
 * @param {string|number} id
 * @param {{reason:string,untilAt?:string}} [body]
 */
export const banUser = (id, body = {}) => axios.put(`/admin/users/${id}/ban`, body)

/** 解封 */
export const unbanUser = (id) => axios.put(`/admin/users/${id}/unban`)

/**
 * 设置用户角色（super_admin 限定）
 * @param {string|number} id
 * @param {{add?:string[],remove?:string[]}} body
 */
export const setUserRoles = (id, body) => axios.put(`/admin/users/${id}/roles`, body)

/** 强制全设备下线 */
export const revokeAllSessions = (id) => axios.post(`/admin/users/${id}/sessions/revoke-all`)

/* ---------------- 登录审计 ---------------- */

/**
 * 登录事件审计查询
 * @param {{userId?:number,type?:string,from?:string,to?:string,deviceType?:string,page?:number,size?:number}} [params]
 */
export const listLoginEvents = (params = {}) => axios.get('/admin/audit/login-events', { params })

/* ---------------- 内容 / 订单 ---------------- */

/** 帖子列表 */
export const listPosts = () => axios.get('/admin/posts')

/** 下架帖子 */
export const offlinePost = (id) => axios.put(`/admin/posts/${id}/offline`)

/** 订单查询 */
export const listOrders = (status) =>
  axios.get('/admin/orders', { params: status ? { status } : {} })
