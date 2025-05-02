<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { isLoggedIn as checkIsLoggedIn, login } from '@/services/keycloak'

const isAuthenticated = ref(false)

onMounted(() => {
  if (checkIsLoggedIn()) {
    isAuthenticated.value = true
  } else {
    login()
  }
})
</script>

<template>
  <div v-if="isAuthenticated">
    <slot></slot>
  </div>
</template>
