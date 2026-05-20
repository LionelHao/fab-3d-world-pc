import axios from '../utils/axios'

/** 登录 */
export const login = (params) => axios.post('/auth/login', params)

/** 登出 */
export const logout = () => axios.post('/auth/logout')

/** 当前用户资料 */
export const getUserInfo = () => axios.get('/user/info')
