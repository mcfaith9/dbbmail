import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHashHistory(),

  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/components/mail/MailIndex.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/pin-login',
      name: 'pin-login',
      component: () => import('@/components/auth/LoginView.vue'),
      meta: {
        guestOnly: true,
      },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/pin-login')
    return
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    next('/dashboard')
    return
  }

  next()
})

export default router