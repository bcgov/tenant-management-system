<script setup lang="ts">
import { onMounted, ref } from 'vue'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { useNotification } from '@/composables'
import { Service, Tenant } from '@/models'
import { useServiceStore } from '@/stores'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()

// --- Component State ---------------------------------------------------------

const allServices = ref<Service[]>([])
const isLoading = ref(false)
const tenantServices = ref<Service[]>([])

// --- Component Methods -------------------------------------------------------

async function loadServices() {
  isLoading.value = true

  try {
    allServices.value = await serviceStore.fetchServices()
    tenantServices.value = await serviceStore.fetchTenantServices(
      props.tenant.id,
    )
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
  <ServiceManagement
    :all-services="allServices"
    :tenant="tenant"
    :tenant-services="tenantServices"
  />
</template>
