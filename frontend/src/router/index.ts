import { createRouter, createWebHistory } from 'vue-router'

import GroupManagementContainer from '@/components/route/GroupManagementContainer.vue'
import SettingsContainer from '@/components/route/SettingsContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantManagementContainer from '@/components/route/TenantManagementContainer.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'

const routes = [
  { path: '/', component: LandingPageContainer },
  { path: '/settings', component: SettingsContainer },
  { path: '/tenants', component: TenantListContainer },
  {
    path: '/tenants/:tenantId',
    component: TenantManagementContainer,
    props: true,
  },
  {
    path: '/tenants/:tenantId/groups/:groupId',
    component: GroupManagementContainer,
    props: true,
  },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

export default router
