import { createRouter, createWebHistory } from 'vue-router'

import SettingsContainer from '@/components/route/SettingsContainer.vue'
import TenantListContainer from '@/components/route/TenantListContainer.vue'
import TenantManageContainer from '@/components/route/TenantManageContainer.vue'

const routes = [
  { path: '/', redirect: '/tenants' },
  { path: '/settings', component: SettingsContainer },
  { path: '/tenants', component: TenantListContainer },
  { path: '/tenants/:id', component: TenantManageContainer, props: true },
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

export default router
