<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/models'
import { useAuthStore } from '@/stores'

// --- Component Interface -----------------------------------------------------

defineProps<{
  user: User | null
}>()

// --- Component Methods -------------------------------------------------------

const authStore = useAuthStore()
const logoutURL = computed(() => authStore.logout())
</script>

<template>
  <v-app-bar class="px-4" elevation="1" app>
    <v-toolbar-title class="flex-grow-1 d-flex align-center">
      <img alt="Logo" class="logo" src="/BCID_H_RGB_pos.svg" />
      <span class="app-title">Connected Services, Team Access, and Roles (CSTAR)</span>
    </v-toolbar-title>

    <div v-if="user" class="d-flex align-center user-info">
      <v-icon icon="mdi-account-outline" size="large" />
      <span class="text-no-wrap ms-1 me-4">{{ user.ssoUser.displayName }}</span>
      <v-btn :href="logoutURL" class="logout-btn">
        <v-icon class="me-1" icon="mdi-logout" size="x-large" />
        Logout
      </v-btn>
    </div>
  </v-app-bar>
</template>

<style scoped>
.app-title {
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logo {
  height: 60px;
  margin-right: 8px;
  vertical-align: middle;
}

.user-info {
  flex-shrink: 0;
}
</style>
