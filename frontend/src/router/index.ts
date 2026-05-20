import { createRouter, createWebHistory } from 'vue-router'

import GroupListContainer from '@/components/route/GroupListContainer.vue'
import GroupRoleContainer from '@/components/route/GroupRoleContainer.vue'
import GroupUserContainer from '@/components/route/GroupUserContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import LandingPageBceidContainer from '@/components/route/LandingPageBceidContainer.vue'
import ServiceManagementContainer from '@/components/route/ServiceManagementContainer.vue'
import SettingsServiceContainer from '@/components/route/SettingsServiceContainer.vue'
import SettingsTenantRequestContainer from '@/components/route/SettingsTenantRequestContainer.vue'
import TenantContainer from '@/components/route/TenantContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantGroupContainer from '@/components/route/TenantGroupContainer.vue'
import TenantUserContainer from '@/components/route/TenantUserContainer.vue'

const routes = [
  { path: '/', component: LandingPageContainer },
  { path: '/bceid', component: LandingPageBceidContainer },
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
  { path: '/tenants', component: TenantListContainer },
  {
    path: '/tenants/:tenantId',
    component: TenantContainer,
    props: true,
    children: [
      {
        path: 'groups',
        component: GroupListContainer,
      },
      {
        path: 'groups/:groupId',
        component: TenantGroupContainer,
        children: [
          { path: 'members', component: GroupUserContainer },
          { path: 'roles', component: GroupRoleContainer },
        ],
        props: true,
      },
      {
        path: 'services',
        component: ServiceManagementContainer,
      },
      {
        path: 'users',
        component: TenantUserContainer,
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
