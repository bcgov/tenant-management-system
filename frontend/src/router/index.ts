import { createRouter, createWebHistory } from 'vue-router'

import LandingPageContainer from '@/components/route/LandingPageContainer.vue'

const routes = [
  {
    path: '/',
    // Eagerly load this since it's the entry point route.
    component: LandingPageContainer,
  },
  {
    path: '/bceid',
    component: () => import('@/components/route/LandingPageBceidContainer.vue'),
  },
  {
    path: '/settings',
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

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

export default router
