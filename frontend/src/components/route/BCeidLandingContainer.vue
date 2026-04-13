<script lang="ts" setup>
import { mdiHumanGreeting } from '@mdi/js'
import { computed } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const logoutURL = computed(() => authStore.logout())
</script>

<template>
  <v-container fluid>
    <v-row>
      <div class="text-center w-100">
        <v-icon :icon="mdiHumanGreeting" class="supersize my-4" />
        <h2>{{ $t('landing.bceidWelcome') }}</h2>
        <p class="max-w-text">{{ $t('landing.bceidWelcomeDesc') }}</p>
        <div class="my-4">
          <v-btn :href="logoutURL" color="primary normal-case">{{
            $t('general.logout')
          }}</v-btn>
        </div>
      </div>
    </v-row>
  </v-container>
</template>

<style scoped>
.supersize {
  font-size: 6.8rem;
  color: rgb(var(--v-theme-primary));
}

.max-w-text {
  max-width: 590px;
  margin: auto;
}

.normal-case {
  text-transform: none;
}
</style>
