<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isRolesRoute = computed(() => route.path.startsWith('/roles'))
const isTenantRoute = computed(() => route.path.startsWith('/tenant'))
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
        :active="isRolesRoute"
        exact-active-class=""
        to="/roles"
        variant="text"
      >
        My Roles
      </v-btn>
    </div>
  </v-toolbar>
</template>
