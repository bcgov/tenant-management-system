<script setup lang="ts">
// Import necessary functions and refs from Vue and Keycloak service
import { ref, onMounted } from 'vue'
import { isLoggedIn as checkIsLoggedIn, login } from '@/services/keycloak'

// Create a reactive reference to track authentication status
const isAuthenticated = ref(false)

// When the component is mounted, check if the user is logged in
onMounted(() => {
  if (checkIsLoggedIn()) {
    // If the user is logged in, set isAuthenticated to true
    isAuthenticated.value = true
  } else {
    // Optionally redirect to login page if not authenticated
    login()
  }
})
</script>

<template>
  <!-- Render child components only if the user is authenticated -->
  <div v-if="isAuthenticated">
    <slot></slot>
  </div>
</template>
