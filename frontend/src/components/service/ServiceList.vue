<script setup lang="ts">
import ServiceListCard from '@/components/service/ServiceListCard.vue'
import { type Service, type ServiceId } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  isTenantOwner: boolean
  services: Service[]
}>()

const emit = defineEmits<{
  (event: 'add-service', serviceId: ServiceId): void
}>()

// --- Component Methods -------------------------------------------------------

function handleAddService(id: Service['id']) {
  emit('add-service', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="service in services" :key="service.id" cols="12" md="4">
      <ServiceListCard
        :is-tenant-owner="isTenantOwner"
        :service="service"
        @click-add="handleAddService(service.id)"
      />
    </v-col>
  </v-row>
</template>
