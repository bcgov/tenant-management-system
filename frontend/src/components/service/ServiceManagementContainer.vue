<script setup lang="ts">
import { ref, onMounted } from 'vue'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { useNotification } from '@/composables'
import { Service, Tenant } from '@/models'
import { useServiceStore } from '@/stores'

// --- Component Interface -----------------------------------------------------

defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()

// --- Component State ---------------------------------------------------------

const isLoading = ref(false)
const services = ref<Service[]>([])

// --- Component Methods -------------------------------------------------------

async function loadServices() {
  isLoading.value = true

  try {
    services.value = await serviceStore.fetchServices()
  } catch {
    notification.error('Failed to load services')
  } finally {
    isLoading.value = false
  }
}

// --- Lifecycle ---------------------------------------------------------------

onMounted(() => {
  loadServices()
})
</script>

<template>
  <ServiceManagement :services="services" :tenant="tenant" />
</template>
