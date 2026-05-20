import { defineStore } from 'pinia'

/**
 * 用户鉴权 store —— PC Web 端登录态唯一来源,内部从 localStorage 水合。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('pc_token') || '',
    userInfo: localStorage.getItem('pc_userInfo')
      ? JSON.parse(localStorage.getItem('pc_userInfo'))
      : null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => !!state.userInfo && state.userInfo.role === 'admin'
  },

  actions: {
    login(token, userInfo) {
      this.token = token
      this.userInfo = userInfo || null
      localStorage.setItem('pc_token', token)
      localStorage.setItem('pc_userInfo', JSON.stringify(userInfo || null))
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('pc_token')
      localStorage.removeItem('pc_userInfo')
    }
  }
})
