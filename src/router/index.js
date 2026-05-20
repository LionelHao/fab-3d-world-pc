import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
  { path: '/market', name: 'Market', component: () => import('@/views/Market.vue') },
  { path: '/goods/:id', name: 'GoodsDetail', component: () => import('@/views/GoodsDetail.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫:登录与运营角色校验
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/home')
    return
  }
  next()
})

export default router
