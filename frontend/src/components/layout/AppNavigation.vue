<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { currentUserIsOperationsAdmin } from '@/utils/permissions'

// --- Store and Composable Setup ----------------------------------------------

const route = useRoute()

// --- Computed Values ---------------------------------------------------------

const isOperationsAdmin = computed(() => currentUserIsOperationsAdmin())
const isRouteSettings = computed(() => route.path.startsWith('/settings'))
const isRouteTenant = computed(() => route.path.startsWith('/tenant'))
</script>

<template>
  <v-toolbar class="px-12" color="surface-light-gray" elevation="0" flat>
    <div class="d-flex align-center" style="gap: 8px">
      <v-btn
        :active="isRouteTenant"
        exact-active-class=""
        to="/tenants"
        variant="text"
      >
        Tenants
      </v-btn>
      <v-btn
        v-if="isOperationsAdmin"
        :active="isRouteSettings"
        exact-active-class=""
        to="/settings"
        variant="text"
      >
        Settings
      </v-btn>
    </div>
  </v-toolbar>
</template>
