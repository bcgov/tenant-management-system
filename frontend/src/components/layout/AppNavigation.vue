<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/useAuthStore'
import { currentUserIsOperationsAdmin } from '@/utils/permissions'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const route = useRoute()

// --- Computed Values ---------------------------------------------------------

const isOperationsAdmin = computed(() => currentUserIsOperationsAdmin())
const loggedIn = computed(() => authStore.isAuthenticated)

// Use the route path to determine which button is active.
const isRouteSettings = computed(() => route.path.startsWith('/settings'))
const isRouteTenant = computed(() => route.path.startsWith('/tenant'))
</script>

<template>
  <v-toolbar class="px-12" color="surface-light-gray" elevation="0" flat>
    <div class="d-flex align-center" style="gap: 8px">
      <v-btn
        v-if="loggedIn"
        :active="isRouteTenant"
        to="/tenants"
        variant="text"
      >
        Tenants
      </v-btn>
      <v-btn
        v-if="isOperationsAdmin && loggedIn"
        :active="isRouteSettings"
        to="/settings"
        variant="text"
      >
        Settings
      </v-btn>
    </div>
  </v-toolbar>
</template>
