<script setup lang="ts">
import { computed } from 'vue'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
import { useAuthStore } from '@/stores'
import LandingPageContainer from './components/route/LandingPageContainer.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.getUser)
const loggedOut = computed(() => authStore.loggedOut)
</script>

<template>
  <v-app>
    <!-- Custom Components common to all application views -->
    <AppNotifications />
    <AppHeader :user="user" />

    <!-- Router view for dynamic component rendering -->
    <v-main>
      <AppNavigation />
      <v-container class="mt-10 px-12" fluid>
        <div v-if="loggedOut" class="text-center my-3">
          <h2>{{ $t('general.sessionExpired') }}</h2>
          <p>{{ $t('general.sessionExpiredDesc') }}</p>
          <LandingPageContainer />
        </div>
        <router-view v-else />
      </v-container>
    </v-main>
  </v-app>
</template>
