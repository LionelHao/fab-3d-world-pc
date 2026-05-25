import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { t } from '@/i18n'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
  { path: '/market', name: 'Market', component: () => import('@/views/Market.vue') },
  { path: '/goods/:id', name: 'GoodsDetail', component: () => import('@/views/GoodsDetail.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue')
  },
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
    meta: { requiresAuth: true, requiresRoles: ['admin', 'super_admin'] }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 路由守卫 — user-auth P1
 *
 * - requiresAuth + 未登录 → /login?from=<original>
 * - requiresRoles + 角色不匹配 → /home (warning toast)
 * - 已登录用户访问 /login → /home (跳过登录页)
 */
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/home')
    return
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { from: to.fullPath } })
    return
  }

  if (to.meta.requiresRoles) {
    const allowed = to.meta.requiresRoles.some((r) => userStore.hasRole(r))
    if (!allowed) {
      ElMessage.warning(t('common.toast.forbidden'))
      next('/home')
      return
    }
  }

  next()
})

export default router
