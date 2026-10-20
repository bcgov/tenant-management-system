<script setup lang="ts">
import { mdiClockOutline } from '@mdi/js'

import { type TenantRequest } from '@/models/tenantrequest.model'

// --- Component Interface -----------------------------------------------------

const { tenantRequest } = defineProps<{
  tenantRequest: TenantRequest
}>()
</script>

<template>
  <v-card class="card pt-4" color="surface-gold-10-custom">
    <v-card-subtitle class="p-label">
      <v-icon :icon="mdiClockOutline" />
      Pending Approval
    </v-card-subtitle>
    <v-card-title class="card-title">
      {{ tenantRequest.name }}
    </v-card-title>
    <v-card-subtitle class="card-subtitle">
      {{ tenantRequest.ministryName }}

      <p class="p-small">Requested: {{ tenantRequest.createdDate }}</p>
    </v-card-subtitle>
  </v-card>
</template>
