import axios from 'axios'
import { useUserStore } from '@/stores/user'

// API 基地址来自环境变量
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL

// 请求拦截器:统一附带 token
axios.interceptors.request.use(config => {
  const token = useUserStore().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

// 响应拦截器:拆解统一返回体 {code, message, data}
axios.interceptors.response.use(res => {
  const body = res.data
  if (body && typeof body === 'object' && 'code' in body) {
    if (body.code !== 200) {
      return Promise.reject(body)
    }
    return body.data
  }
  return body
})

export default axios
