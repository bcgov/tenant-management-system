<script setup lang="ts">
import { watchEffect } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Watchers and Effects ----------------------------------------------------

watchEffect(() => {
  if (!authStore.isAuthenticated) {
    globalThis.location.href = '/'
  }
})
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    <slot></slot>
  </div>
</template>
