<script setup lang="ts">
import { watchEffect } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { currentUserIsBceid, currentUserIsIdir } from '@/utils/permissions'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Watchers and Effects ----------------------------------------------------

watchEffect(() => {
  if (!authStore.isAuthenticated) {
    globalThis.location.href = '/'
  }

  if (currentUserIsBceid()) {
    globalThis.location.href = '/bceid'
  }
})
</script>

<template>
  <div v-if="currentUserIsIdir()" data-test-id="slot">
    <slot />
  </div>
</template>
