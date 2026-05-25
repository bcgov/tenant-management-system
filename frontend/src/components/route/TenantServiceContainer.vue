<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { useNotification } from '@/composables/useNotification'
import { type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { useServiceStore } from '@/stores/useServiceStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

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

const isAdmin = computed(() => {
  return currentUserHasRole(tenant.value, ROLES.TENANT_OWNER.value)
})

const services = computed(() => serviceStore.services)

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(props.tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${props.tenantId} not found`)
  }

  return tenant
})

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
    <v-container v-if="tenantServices.length === 0" class="fill-height mt-12">
      <v-row v-if="isAdmin" class="center-align justify-center">
        <v-col class="align-center d-flex flex-column" cols="auto">
          <h1>Connected Services</h1>
          <p class="p-large">
            Connected Services allow your tenant to manage access and assign
            service roles to users and groups.
          </p>

          <v-divider class="my-12" style="width: 100%" />

          <h3 class="mb-2">No Connected Services added yet</h3>
          <p>
            Add Connected Services to your tenant to make service roles
            available to groups.
          </p>

          <ul>
            <li>Select a Connected Service from the dropdown</li>
            <li>Click Add Connected Service</li>
            <li>Go to the Service Roles page to assign roles to groups</li>
          </ul>
        </v-col>
      </v-row>
      <v-row v-else class="center-align justify-center">
        <v-col class="align-center d-flex flex-column" cols="auto">
          <h1>No Connected Services available</h1>
          <span class="p-large">
            There are currently no Connected Services available to you in this
            tenant.
          </span>
          <span class="p-large">
            If you believe you should have access to a service, contact your
            Tenant Owner.
          </span>
        </v-col>
      </v-row>
    </v-container>
    <ServiceManagement
      v-else
      :services="services"
      :tenant="tenant!"
      :tenant-services="tenantServices"
      @add-service="handleAddService"
    />
  </template>
</template>
