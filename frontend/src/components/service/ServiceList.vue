<script setup lang="ts">
import { computed } from 'vue'

import ServiceListCard from '@/components/service/ServiceListCard.vue'
import { type Service, type ServiceId } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

const { isTenantOwner, services } = defineProps<{
  isTenantOwner: boolean
  services: Service[]
}>()

const emit = defineEmits<{
  'add-service': [ServiceId]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedServices = computed(() => {
  return [...services].sort((a, b) => a.name.localeCompare(b.name))
})

// --- Component Methods -------------------------------------------------------

const handleAddService = (id: Service['id']) => {
  emit('add-service', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="service in sortedServices" :key="service.id" cols="12" md="4">
      <ServiceListCard
        :is-tenant-owner="isTenantOwner"
        :service="service"
        @click-add="handleAddService(service.id)"
      />
    </v-col>
  </v-row>
</template>
