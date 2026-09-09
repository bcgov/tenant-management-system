<script setup lang="ts">
import { computed, ref } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import ServiceManagement from '@/components/service/ServiceManagement.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { useServiceStore } from '@/stores/useServiceStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const { tenantId } = defineProps<{
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()
const tenantStore = useTenantStore()

// --- Component Methods -------------------------------------------------------

const handleAddService = async (serviceId: ServiceId) => {
  try {
    const service = await serviceStore.addServiceToTenant(tenantId, serviceId)

    notification.success(
      `${service.displayName} has been added to this tenant.`,
    )
  } catch {
    notification.error('Failed to add service to tenant')
  }
}

// --- Computed Values ---------------------------------------------------------

const services = computed(() =>
  [...serviceStore.services].sort((service1, service2) =>
    service1.displayName.localeCompare(service2.displayName),
  ),
)

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`)
  }

  return tenant
})

const tenantServices = computed(() =>
  [...serviceStore.tenantServices].sort((tenantService1, tenantService2) =>
    tenantService1.displayName.localeCompare(tenantService2.displayName),
  ),
)

// --- Component Lifecycle -----------------------------------------------------

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  const [servicesResult, tenantServicesResult] = await Promise.allSettled([
    serviceStore.fetchServices(),
    serviceStore.fetchTenantServices(tenantId),
  ])

  if (servicesResult.status === 'rejected') {
    notification.error('Failed to load services')
  }

  if (tenantServicesResult.status === 'rejected') {
    notification.error('Failed to load tenant services')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoginContainer>
    <LoadingWrapper
      :loading="!initialized"
      loading-message="Loading connected services..."
    >
      <ServiceManagement
        :services="services"
        :tenant="tenant!"
        :tenant-services="tenantServices"
        @add-service="handleAddService"
      />
    </LoadingWrapper>
  </LoginContainer>
</template>
