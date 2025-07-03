import { createRouter, createWebHistory } from 'vue-router'

import RolesView from '@/views/RolesView.vue'
import TenantListView from '@/views/TenantListView.vue'
import TenantManageView from '@/views/TenantManageView.vue'

const routes = [
  { path: '/', redirect: '/tenants' },
  { path: '/roles', component: RolesView },
  { path: '/tenants', component: TenantListView },
  { path: '/tenants/:id', component: TenantManageView, props: true },
]

const router = createRouter({
  // Use HTML5 history mode
  history: createWebHistory(),
  routes,
})

export default router
