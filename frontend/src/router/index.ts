import { createRouter, createWebHistory } from 'vue-router'

import Roles from '@/components/Roles.vue'
import TenantManagementView from '@/views/TenantManagementView.vue'
import TenantsView from '@/views/TenantsView.vue'

// Define the routes for the application
const routes = [
  { path: '/', redirect: '/tenants' }, // Redirect root path to /tenants
  { path: '/tenants', component: TenantsView },
  { path: '/roles', component: Roles },
  { path: '/tenants/:id', component: TenantManagementView, props: true },
]

// Create a router instance with history mode
const router = createRouter({
  history: createWebHistory(), // Use HTML5 history mode
  routes, // Assign the defined routes to the router
})

export default router // Export the router instance
