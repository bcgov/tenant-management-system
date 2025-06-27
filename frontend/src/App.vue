<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppNotifications from '@/components/layout/AppNotifications.vue'
</script>

<template>
  <v-app>
    <!-- Custom Components common to all application views -->
    <AppNotifications />
    <AppHeader />

    <!-- Router view for dynamic component rendering -->
    <v-main>
      <AppNavigation />
      <v-container fluid class="mt-10 px-12">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* @import 'vuetify/styles'; */
</style>
