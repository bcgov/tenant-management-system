<script setup lang="ts">
import { onMounted, ref } from 'vue'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { useNotification } from '@/composables'
import { Service, Tenant } from '@/models'
import { useServiceStore } from '@/stores'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

async function handleAddService(serviceId: string) {
  try {
    await serviceStore.addServiceToTenant(props.tenant.id, serviceId)

    // Find the added service and add it to tenantServices
    const addedService = allServices.value.find(
      (service) => service.id === serviceId,
    )

    if (addedService) {
      tenantServices.value.push(addedService)
    }

    notification.success(
      `An available ${t('general.servicesLabelLower', 2)} for this tenant was successfully added.`,
    )
  } catch {
    notification.error('Failed to add service to tenant')
  }
}
// --- Lifecycle ---------------------------------------------------------------

onMounted(async () => {
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
})
</script>

<template>
  <ServiceManagement
    :all-services="allServices"
    :tenant="tenant"
    :tenant-services="tenantServices"
    @add-service="handleAddService"
  />
</template>
