<script setup lang="ts">
import { computed, ref } from 'vue'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { useNotification } from '@/composables/useNotification'
import { type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { useServiceStore } from '@/stores/useServiceStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()
const tenantStore = useTenantStore()

// --- Component Methods -------------------------------------------------------

async function handleAddService(serviceId: ServiceId) {
  try {
    await serviceStore.addServiceToTenant(props.tenantId, serviceId)

    // Find the added service and add it to tenantServices.
    const addedService = services.value.find(
      (service) => service.id === serviceId,
    )

    // TODO: what is the implication of this being false?
    if (addedService) {
      serviceStore.tenantServices.push(addedService)
      notification.success(
        `${addedService.displayName} has been added to this tenant.`,
      )
    }
  } catch {
    notification.error('Failed to add service to tenant')
  }
}

// --- Computed Values ---------------------------------------------------------

const services = computed(() =>
  [...serviceStore.services].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  ),
)

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(props.tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${props.tenantId} not found`)
  }

  return tenant
})

const tenantServices = computed(() =>
  [...serviceStore.tenantServices].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  ),
)

// --- Component Lifecycle -----------------------------------------------------

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const initialized = ref(false)
const init = async () => {
  const [servicesResult, tenantServicesResult] = await Promise.allSettled([
    serviceStore.fetchServices(),
    serviceStore.fetchTenantServices(props.tenantId),
  ])

  if (servicesResult.status === 'rejected') {
    notification.error('Failed to load services')
  }

  if (tenantServicesResult.status === 'rejected') {
    notification.error('Failed to load tenant services')
  }

  initialized.value = true
}

init()
</script>

<template>
  <template v-if="initialized">
    <ServiceManagement
      :services="services"
      :tenant="tenant!"
      :tenant-services="tenantServices"
      @add-service="handleAddService"
    />
  </template>
</template>
