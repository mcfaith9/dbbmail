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
      path: '/',
      component: () => import('@/views/MainLayout.vue'),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/components/mail/MailIndex.vue'),
        },
        {
          path: 'file-manager',
          name: 'file-manager',
          component: () => import('@/views/FileManagerView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
      ],
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

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (requiresAuth && !isAuthenticated.value) {
    next('/pin-login')
    return
  }

  if (guestOnly && isAuthenticated.value) {
    next('/dashboard')
    return
  }

  next()
})

export default router
