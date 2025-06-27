import { createRouter, createWebHistory } from 'vue-router'

import Roles from '@/components/Roles.vue'
import TenantListView from '@/views/TenantListView.vue'
import TenantManageView from '@/views/TenantManageView.vue'

// Define the routes for the application
const routes = [
  { path: '/', redirect: '/tenants' }, // Redirect root path to /tenants
  { path: '/roles', component: Roles },
  { path: '/tenants', component: TenantListView },
  { path: '/tenants/:id', component: TenantManageView, props: true },
]

// Create a router instance with history mode
const router = createRouter({
  history: createWebHistory(), // Use HTML5 history mode
  routes, // Assign the defined routes to the router
})

export default router // Export the router instance
