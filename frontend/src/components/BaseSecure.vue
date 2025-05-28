<script setup lang="ts">
import { watchEffect } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

watchEffect(() => {
  if (!authStore.isAuthenticated) {
    authStore.login()
  }
})
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    <slot></slot>
  </div>
</template>
