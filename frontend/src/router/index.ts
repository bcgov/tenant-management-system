import { createRouter, createWebHistory } from 'vue-router'
import TenanciesView from '../views/TenanciesView.vue'
import Roles from '@/components/Roles.vue'
import ManageTenancy from '@/components/ManageTenancy.vue'

// Define the routes for the application
const routes = [
  { path: '/', redirect: '/tenancies' }, // Redirect root path to /tenancies
  { path: '/tenancies', component: TenanciesView }, // Route for Tenancies component
  { path: '/roles', component: Roles }, // Route for Roles component
  { path: '/tenancies/:id', component: ManageTenancy, props: true }, // Route for Manage Tenancy component with dynamic id
]

// Create a router instance with history mode
const router = createRouter({
  history: createWebHistory(), // Use HTML5 history mode
  routes, // Assign the defined routes to the router
})

export default router // Export the router instance
