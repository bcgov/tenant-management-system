<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { currentUserIsOperationsAdmin } from '@/utils/permissions'

const route = useRoute()

const isSettingsRoute = computed(() => route.path.startsWith('/settings'))
const isTenantRoute = computed(() => route.path.startsWith('/tenant'))

const isOperationsAdmin = computed(() => currentUserIsOperationsAdmin())
</script>

<template>
  <v-toolbar class="px-12" color="surface-light-gray" elevation="0" flat>
    <div class="d-flex align-center" style="gap: 8px">
      <v-btn
        :active="isTenantRoute"
        exact-active-class=""
        to="/tenants"
        variant="text"
      >
        Tenants
      </v-btn>
      <v-btn
        v-if="isOperationsAdmin"
        :active="isSettingsRoute"
        exact-active-class=""
        to="/settings"
        variant="text"
      >
        Settings
      </v-btn>
    </div>
  </v-toolbar>
</template>
