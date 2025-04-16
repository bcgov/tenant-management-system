<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import {
  logout,
  isLoggedIn as checkIsLoggedIn,
  getUser,
} from '@/services/keycloak'
import type { User } from '@/types/User'

const isLoggedIn = ref(checkIsLoggedIn())
const userInfo = ref<User | null>(null)

watchEffect(() => {
  if (isLoggedIn.value) {
    userInfo.value = getUser()
  } else {
    userInfo.value = null
  }
})

const handleLogout = () => {
  logout()
  isLoggedIn.value = false
}
</script>

<template>
  <v-app-bar elevation="1">
    <v-toolbar-title>
      <img src="/BCID_H_RGB_pos.svg" alt="Logo" class="logo" />
      Tenant Management System
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
  height: 40px;
  margin-right: 8px;
}

.v-toolbar-title {
  display: flex;
  align-items: center;
}
</style>
