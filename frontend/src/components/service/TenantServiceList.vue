<script setup lang="ts">
import TenantServiceListCard from '@/components/service/TenantServiceListCard.vue'
import { type Service } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  tenantServices: Service[]
}>()
</script>

<template>
  <v-row>
    <v-col
      v-for="tenantService in tenantServices"
      :key="tenantService.id"
      cols="12"
      md="3"
    >
      <TenantServiceListCard :service="tenantService" />
    </v-col>
  </v-row>
</template>
