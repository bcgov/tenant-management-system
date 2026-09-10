<script setup lang="ts">
import { computed } from 'vue'

import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenants } = defineProps<{
  tenants: Tenant[]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedTenants = computed(() => {
  return [...tenants].sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <v-row>
    <v-col
      v-for="tenant in sortedTenants"
      :key="tenant.id"
      cols="12"
      lg="4"
      md="6"
    >
      <TenantListCard :tenant="tenant" class="w-100" />
    </v-col>
  </v-row>
</template>
