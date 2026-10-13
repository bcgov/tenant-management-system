<script setup lang="ts">
import { computed } from 'vue'

import TenantServiceListCard from '@/components/service/TenantServiceListCard.vue'
import { type Service } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

const { tenantServices } = defineProps<{
  tenantServices: Service[]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedTenantServices = computed(() => {
  return [...tenantServices].sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <v-row>
    <v-col
      v-for="tenantService in sortedTenantServices"
      :key="tenantService.id"
      cols="12"
      md="4"
    >
      <TenantServiceListCard :service="tenantService" />
    </v-col>
  </v-row>
</template>
