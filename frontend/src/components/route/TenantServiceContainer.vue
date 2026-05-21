<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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

// --- Component State ---------------------------------------------------------

const { t } = useI18n()

// --- Component Methods -------------------------------------------------------

async function handleAddService(serviceId: ServiceId) {
  try {
    await serviceStore.addServiceToTenant(props.tenantId, serviceId)

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

// --- Computed Values ---------------------------------------------------------

const services = computed(() => serviceStore.services)

const tenant = computed(() => tenantStore.getTenant(props.tenantId))

const tenantServices = computed(() => serviceStore.tenantServices)

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
