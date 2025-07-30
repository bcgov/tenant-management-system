import { createRouter, createWebHistory } from 'vue-router'

import GroupManagementContainer from '@/components/route/GroupManagementContainer.vue'
import SettingsContainer from '@/components/route/SettingsContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantManagementContainer from '@/components/route/TenantManagementContainer.vue'

const routes = [
  { path: '/', redirect: '/tenants' },
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
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

export default router
