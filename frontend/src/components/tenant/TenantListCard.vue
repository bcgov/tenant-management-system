<script setup lang="ts">
/**
 * Design decision: although cards are presentational components, their purpose
 * is to navigate to a specific route. Since click events include not only plain
 * clicks but also keyboard events and modified click like CTRL-click to open in
 * a new tab, a router-link is the simplest way to handle all cases.
 *
 * In other words, this is a presentational component, but its interface is not
 * just props and events, as it also includes the router.
 */

import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenant } = defineProps<{
  tenant: Tenant
}>()
</script>

<template>
  <router-link :to="`/tenants/${tenant.id}/services`" class="card-link">
    <v-card class="card pb-4 pt-2" color="surface-light-gray">
      <v-card-title class="card-title">
        {{ tenant.name }}
      </v-card-title>
      <v-card-subtitle class="card-subtitle">
        {{ tenant.ministryName }}
      </v-card-subtitle>
    </v-card>
  </router-link>
</template>
