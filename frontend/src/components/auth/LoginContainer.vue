<script setup lang="ts">
import { watchEffect } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Watchers and Effects ----------------------------------------------------

watchEffect(() => {
  if (!authStore.authenticatedUser) {
    globalThis.location.href = '/'
  }
})
</script>

<template>
  <div v-if="authStore.authenticatedUser">
    <slot></slot>
  </div>
</template>
