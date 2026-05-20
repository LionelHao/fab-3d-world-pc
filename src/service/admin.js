import axios from '../utils/axios'

/** 数据看板统计 */
export const getDashboard = () => axios.get('/admin/dashboard')

/** 帖子列表 */
export const listPosts = () => axios.get('/admin/posts')

/** 下架帖子 */
export const offlinePost = (id) => axios.put(`/admin/posts/${id}/offline`)

/** 用户列表 */
export const listUsers = () => axios.get('/admin/users')

/** 封禁用户 */
export const banUser = (id) => axios.put(`/admin/users/${id}/ban`)

/** 解禁用户 */
export const unbanUser = (id) => axios.put(`/admin/users/${id}/unban`)

/** 订单查询 */
export const listOrders = (status) =>
  axios.get('/admin/orders', { params: status ? { status } : {} })
