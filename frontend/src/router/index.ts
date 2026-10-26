import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'

import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  currentUserIsBceid,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresOperationsAdmin?: boolean
    // Everything else requires IDIR.
  }
}

const routes = [
  {
    path: '/',
    meta: { public: true },
    component: LandingPageContainer, // Eagerly load this entry point route.
  },
  {
    path: '/bceid',
    meta: { public: true },
    component: () => import('@/components/route/LandingPageBceidContainer.vue'),
  },
  {
    path: '/settings',
    meta: { requiresOperationsAdmin: true },
    redirect: '/settings/requests',
    children: [
      {
        path: 'requests',
        component: () =>
          import('@/components/route/SettingsTenantRequestContainer.vue'),
      },
      {
        path: 'services',
        component: () =>
          import('@/components/route/SettingsServiceContainer.vue'),
      },
    ],
  },
  {
    path: '/tenants',
    component: () => import('@/components/route/TenantListContainer.vue'),
  },
  {
    path: '/tenants/:tenantId',
    component: () => import('@/components/route/TenantHeaderContainer.vue'),

    props: true,
    children: [
      {
        path: 'groups',
        component: () => import('@/components/route/GroupListContainer.vue'),
        props: true,
      },
      {
        path: 'groups/:groupId',
        component: () => import('@/components/route/GroupHeaderContainer.vue'),
        props: true,
        children: [
          {
            path: 'members',
            component: () =>
              import('@/components/route/GroupMemberContainer.vue'),

            props: true,
          },
          {
            path: 'roles',
            component: () =>
              import('@/components/route/GroupRoleContainer.vue'),

            props: true,
          },
        ],
      },
      {
        path: 'services',
        component: () =>
          import('@/components/route/TenantServiceContainer.vue'),
        props: true,
      },
      {
        path: 'users',
        component: () => import('@/components/route/TenantUserContainer.vue'),
        props: true,
      },
    ],
  },
  { path: '/:catchAll(.*)', redirect: '/' },
]

export const createAppRouter = (
  history: RouterHistory = createWebHistory(),
) => {
  const router = createRouter({ history, routes })

  router.beforeEach((to) => {
    const authStore = useAuthStore()

    // Most important: after login go to the starting page for the IdP type.
    if (to.path === '/' && authStore.isAuthenticated) {
      return currentUserIsBceid() ? '/bceid' : '/tenants'
    }

    // Everybody can see the public (landing) page.
    if (to.meta.public) {
      return true
    }

    // If it's not a public page and the user isn't authenticated, go to login.
    if (!authStore.isAuthenticated) {
      return '/'
    }

    // Business BCeID users are restricted to a single landing page.
    if (currentUserIsBceid()) {
      return '/bceid'
    }

    // The admin pages are restricted to admin users.
    if (to.meta.requiresOperationsAdmin && !currentUserIsOperationsAdmin()) {
      return '/tenants'
    }

    // Everything else is IDIR users.
    return true
  })

  return router
}

export default createAppRouter
