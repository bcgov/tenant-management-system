import { createRouter, createWebHistory } from 'vue-router'

import GroupHeaderContainer from '@/components/route/GroupHeaderContainer.vue'
import GroupListContainer from '@/components/route/GroupListContainer.vue'
import GroupRoleContainer from '@/components/route/GroupRoleContainer.vue'
import GroupMemberContainer from '@/components/route/GroupMemberContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import LandingPageBceidContainer from '@/components/route/LandingPageBceidContainer.vue'
import SettingsServiceContainer from '@/components/route/SettingsServiceContainer.vue'
import SettingsTenantRequestContainer from '@/components/route/SettingsTenantRequestContainer.vue'
import TenantHeaderContainer from '@/components/route/TenantHeaderContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantServiceContainer from '@/components/route/TenantServiceContainer.vue'
import TenantUserContainer from '@/components/route/TenantUserContainer.vue'

const routes = [
  {
    path: '/',
    component: LandingPageContainer,
  },
  {
    path: '/bceid',
    component: LandingPageBceidContainer,
  },
  {
    path: '/settings',
    redirect: '/settings/requests',
    children: [
      {
        path: 'requests',
        component: SettingsTenantRequestContainer,
      },
      {
        path: 'services',
        component: SettingsServiceContainer,
      },
    ],
  },
  {
    path: '/tenants',
    component: TenantListContainer,
  },
  {
    path: '/tenants/:tenantId',
    component: TenantHeaderContainer,

    props: true,
    children: [
      {
        path: 'groups',
        component: GroupListContainer,

        props: true,
      },
      {
        path: 'groups/:groupId',
        component: GroupHeaderContainer,

        props: true,
        children: [
          {
            path: 'members',
            component: GroupMemberContainer,

            props: true,
          },
          {
            path: 'roles',
            component: GroupRoleContainer,

            props: true,
          },
        ],
      },
      {
        path: 'services',
        component: TenantServiceContainer,

        props: true,
      },
      {
        path: 'users',
        component: TenantUserContainer,

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
