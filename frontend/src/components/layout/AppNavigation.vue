<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isRolesRoute = computed(() => route.path.startsWith('/roles'))
const isTenantRoute = computed(() => route.path.startsWith('/tenant'))
</script>

<template>
  <v-toolbar class="px-12 mb-12" flat elevation="0">
    <div class="d-flex align-center" style="gap: 8px">
      <v-btn
        to="/tenants"
        variant="text"
        :active="isTenantRoute"
        exact-active-class=""
      >
        Tenants
      </v-btn>
      <v-btn
        to="/roles"
        variant="text"
        :active="isRolesRoute"
        exact-active-class=""
      >
        My Roles
      </v-btn>
    </div>
  </v-toolbar>
</template>
