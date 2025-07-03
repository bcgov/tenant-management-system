<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const userInfo = computed(() => authStore.getUser)

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <v-app-bar class="px-4" elevation="1" app>
    <v-toolbar-title>
      <img alt="Logo" class="logo" src="/BCID_H_RGB_pos.svg" />
      Tenant Management System (TMS)
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <template #append>
      <div v-if="isLoggedIn">
        <v-icon icon="mdi-account-outline" size="x-large"></v-icon>
        <span>{{ userInfo?.displayName }}</span>
        <v-btn @click="handleLogout">Logout</v-btn>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
.logo {
  vertical-align: middle;
  height: 60px;
  margin-right: 8px;
}

.v-toolbar-title {
  display: flex;
  align-items: center;
}
</style>
