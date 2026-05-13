<script setup lang="ts">
import { computed } from 'vue'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
import LandingPageContainer from '@/components/route/LandingPageContainer.vue'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Computed Values ---------------------------------------------------------

const loggedOut = computed(() => authStore.isSessionExpired)

const user = computed(() => {
  return authStore.isAuthenticated ? authStore.authenticatedUser : null
})
</script>

<template>
  <v-app>
    <AppNotifications />
    <AppHeader :user="user" />
    <AppNavigation />

    <v-main>
      <v-container class="fluid mt-10 px-12">
        <div v-if="loggedOut" class="my-3 text-center">
          <h2>{{ $t('general.sessionExpired') }}</h2>
          <p>{{ $t('general.sessionExpiredDesc') }}</p>
          <LandingPageContainer />
        </div>

        <!-- Router view for dynamic component rendering -->
        <router-view v-else />
      </v-container>
    </v-main>
  </v-app>
</template>
