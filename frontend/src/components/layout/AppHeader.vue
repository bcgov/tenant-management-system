<script setup lang="ts">
import { mdiAccountOutline, mdiLogout } from '@mdi/js'

import { type User } from '@/models/user.model'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Component Interface -----------------------------------------------------

defineProps<{
  user: User | null
}>()
</script>

<template>
  <v-app-bar class="px-4" elevation="1">
    <div class="d-flex align-center flex-grow-1">
      <router-link aria-label="C STAR Home" class="me-4 ms-1" to="/">
        <img alt="" height="56" src="/BCID_H_RGB_pos.svg" width="145" />
      </router-link>

      <span class="app-title">
        Connected Services, Team Access, and Roles (<span aria-label="C STAR"
          >CSTAR</span
        >)
      </span>
    </div>

    <div v-if="user" class="d-flex align-center user-info">
      <v-icon :icon="mdiAccountOutline" />
      <span class="me-4 ms-1 text-no-wrap">{{ user.ssoUser.displayName }}</span>
      <v-btn
        :prepend-icon="mdiLogout"
        class="logout-btn me-1"
        @click="authStore.logout()"
      >
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

.user-info {
  flex-shrink: 0;
}
</style>
