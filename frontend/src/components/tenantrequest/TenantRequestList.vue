<script setup lang="ts">
import { computed } from 'vue'

import TenantRequestListCard from '@/components/tenantrequest/TenantRequestListCard.vue'
import { type TenantRequest } from '@/models/tenantrequest.model'

// --- Component Interface -----------------------------------------------------

const { tenantRequests } = defineProps<{
  tenantRequests: TenantRequest[]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedTenantRequests = computed(() => {
  return [...tenantRequests].sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <v-row>
    <v-col
      v-for="tenantRequest in sortedTenantRequests"
      :key="tenantRequest.id"
      cols="12"
      lg="4"
      md="6"
    >
      <TenantRequestListCard :tenant-request="tenantRequest" class="w-100" />
    </v-col>
  </v-row>
</template>
