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
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
@import 'vuetify/styles';
</style>
