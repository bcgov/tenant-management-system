<script lang="ts" setup>
import { mdiHumanGreeting } from '@mdi/js'

import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
</script>

<template>
  <v-container fluid>
    <v-row>
      <div class="text-center w-100">
        <v-icon :icon="mdiHumanGreeting" class="my-4 supersize" />
        <h2>{{ $t('landing.bceidWelcome') }}</h2>

        <p class="max-w-text">{{ $t('landing.bceidWelcomeDesc') }}</p>

        <v-btn class="logout-btn mt-4" @click="authStore.logout()">
          {{ $t('general.logout') }}
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
