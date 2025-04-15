<script setup lang="ts">
// Import necessary functions and refs from Vue and Keycloak service
import { ref } from 'vue'
import { logout, isLoggedIn as checkIsLoggedIn, getUser } from '@/services/keycloak'
import type { User } from '@/types/User'

// Reactive reference to track login status
const isLoggedIn = ref(checkIsLoggedIn())
// Reactive reference for user information
const userInfo = ref<User | null>(null)

// If the user is logged in, get their information
if (isLoggedIn.value) {
  userInfo.value = getUser()
}

// Function to handle user logout
const handleLogout = () => {
  logout()
}
</script>

<template>
  <v-app-bar elevation="1">
    <v-toolbar-title
      ><img src="/BCID_H_RGB_pos.svg" alt="Logo" class="logo" />Tenant Manager</v-toolbar-title
    >
    <v-spacer></v-spacer>
    <template #append>
      <!-- Display user info and logout button if logged in -->
      <div v-if="isLoggedIn">
        <v-icon icon="mdi-account-outline" size="x-large"></v-icon>
        <span>{{ userInfo?.displayName }}</span>
        <v-btn @click="handleLogout">Logout</v-btn>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
/* Style for logo and header elements */
.logo {
  vertical-align: middle;
  height: 40px; /* Adjust as needed */
  margin-right: 8px; /* Space between logo and text */
}

.v-toolbar-title {
  display: flex;
  align-items: center;
}
</style>
