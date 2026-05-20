<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { Service, type ServiceId } from '@/models/service.model'
import { Tenant } from '@/models/tenant.model'
import { useServiceStore } from '@/stores/useServiceStore'

const { t } = useI18n()

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()

// --- Component State ---------------------------------------------------------

const services = ref<Service[]>([])
const tenantServices = ref<Service[]>([])

// --- Component Methods -------------------------------------------------------

async function handleAddService(serviceId: ServiceId) {
  try {
    await serviceStore.addServiceToTenant(props.tenant.id, serviceId)

    // Find the added service and add it to tenantServices.
    const addedService = services.value.find(
      (service) => service.id === serviceId,
    )

    if (addedService) {
      tenantServices.value.push(addedService)
    }

    notification.success(
      `An available ${t('general.servicesLabelLower', 1)} for this tenant ` +
        `was successfully added.`,
    )
  } catch {
    notification.error('Failed to add service to tenant')
  }
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    services.value = await serviceStore.fetchServices()
    tenantServices.value = await serviceStore.fetchTenantServices(
      props.tenant.id,
    )
  } catch {
    // Just give one notification is there is a failure with either one, or more
    // likely, failures with both.
    notification.error('Failed to load services')
  }
})
</script>

<template>
  <LoadingWrapper
    :loading="!services || !tenantServices"
    loading-message="Loading services..."
  >
    <ServiceManagement
      :services="services"
      :tenant="tenant"
      :tenant-services="tenantServices"
      @add-service="handleAddService"
    />
  </LoadingWrapper>
</template>
