<script setup lang="ts">
import { computed } from 'vue'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const user = computed(() => authStore.getUser)

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <v-app>
    <!-- Custom Components common to all application views -->
    <AppNotifications />
    <AppHeader :user="user" @logout="handleLogout" />

    <!-- Router view for dynamic component rendering -->
    <v-main>
      <AppNavigation />
      <v-container class="mt-10 px-12" fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
