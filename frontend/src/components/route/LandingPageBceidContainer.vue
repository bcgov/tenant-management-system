<script lang="ts" setup>
import { mdiHumanGreeting } from '@mdi/js'

import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
</script>

<template>
  <v-container>
    <v-row>
      <div class="text-center w-100">
        <v-icon :icon="mdiHumanGreeting" class="my-4 supersize" />
        <h2>Welcome to CSTAR</h2>

        <p class="max-w-text">
          Thank you for logging in with your BCeID. Your account is available
          for your system administrator to find and manage. There's nothing you
          need to do in CSTAR, and you may log out at any time.
        </p>

        <v-btn class="logout-btn mt-4" @click="authStore.logout()">
          Log Out
        </v-btn>
      </div>
    </v-row>
  </v-container>
</template>

<style scoped>
.max-w-text {
  margin: auto;
  max-width: 590px;
}

.supersize {
  color: rgb(var(--v-theme-primary));
  font-size: 6.8rem;
}
</style>
