<script setup lang="ts">
import { computed } from 'vue'

import ServiceList from '@/components/service/ServiceList.vue'
import TenantServiceList from '@/components/service/TenantServiceList.vue'
import { type Service, type ServiceId } from '@/models/service.model'
import { type Tenant } from '@/models/tenant.model'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const { services, tenant, tenantServices } = defineProps<{
  services: Service[]
  tenant: Tenant
  tenantServices: Service[]
}>()

const emit = defineEmits<{
  'add-service': [serviceId: ServiceId]
}>()

// --- Computed Values ---------------------------------------------------------

// Available Services = Services - Tenant Services
const availableServices = computed(() => {
  return services.filter(
    (service) => !tenantServices.some((ts) => ts.id === service.id),
  )
})

const isTenantOwner = computed(() => {
  return currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)
})

// --- Component Methods -------------------------------------------------------

const handleAddService = async (serviceId: ServiceId) => {
  emit('add-service', serviceId)
}
</script>

<template>
  <v-container
    v-if="availableServices.length === 0 && tenantServices.length === 0"
  >
    <h3>Connected services</h3>
    <p>There are no connected services set up in this CSTAR environment.</p>
  </v-container>
  <v-container v-else>
    <template v-if="tenantServices.length === 0">
      <v-container class="text-center">
        <template v-if="isTenantOwner">
          <h3>Add your first connected service</h3>
          <p class="mt-0">
            Add a connected service, then go to service roles to assign roles to
            groups.
          </p>
        </template>
        <template v-else>
          <h3>No connected services have been added</h3>
          <p class="mt-0">Connected services are managed by tenant owners.</p>
        </template>
      </v-container>
    </template>

    <template v-if="tenantServices.length > 0">
      <h3>Connected services</h3>
      <TenantServiceList :tenant-services="tenantServices" />
      <v-divider class="my-12" />
    </template>

    <h3 v-if="tenantServices.length > 0">Available services</h3>

    <template v-if="availableServices.length > 0">
      <template v-if="tenantServices.length > 0">
        <p v-if="isTenantOwner" class="mb-8">
          Add a connected service, then go to service roles to assign roles to
          groups.
        </p>
        <p v-else>Contact a tenant owner to request additional services.</p>
      </template>
      <ServiceList
        :is-tenant-owner="isTenantOwner"
        :services="availableServices"
        @add-service="handleAddService"
      />
    </template>
    <p v-else>
      All available services have already been added to this tenant. Additional
      connected services will appear here when they become available.
    </p>
  </v-container>
</template>
