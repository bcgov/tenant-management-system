<script setup lang="ts">
import { computed } from 'vue'

import ServiceList from '@/components/service/ServiceList.vue'
import TenantServiceList from '@/components/service/TenantServiceList.vue'
import { type Service, type ServiceId } from '@/models/service.model'
import { type Tenant } from '@/models/tenant.model'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  services: Service[]
  tenant: Tenant
  tenantServices: Service[]
}>()

const emit = defineEmits<{
  (event: 'add-service', serviceId: ServiceId): void
}>()

// --- Computed Values ---------------------------------------------------------

// Available Services = Services - Tenant Services
const availableServices = computed(() => {
  return props.services.filter(
    (service) => !props.tenantServices.some((ts) => ts.id === service.id),
  )
})

const isTenantOwner = computed(() => {
  return currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value)
})

// --- Component Methods -------------------------------------------------------

function handleAddService(serviceId: ServiceId) {
  emit('add-service', serviceId)
}
</script>

<template>
  <v-container
    v-if="availableServices.length === 0 && tenantServices.length === 0"
  >
    <h3>Connected Services</h3>
    <p>There are no Connected Services set up in this CSTAR environment.</p>
  </v-container>
  <v-container v-else>
    <template v-if="tenantServices.length === 0">
      <v-container class="text-center">
        <template v-if="isTenantOwner">
          <h3>Add your first Connected Service</h3>
          <p class="mt-0">
            Add a Connected Service, then go to Service Roles to assign roles to
            groups.
          </p>
        </template>
        <template v-else>
          <h3>No Connected Services have been added</h3>
          <p class="mt-0">Connected Services are managed by Tenant Owners.</p>
        </template>
      </v-container>
    </template>

    <template v-if="tenantServices.length > 0">
      <h3>{{ $t('general.servicesLabel', 2) }}</h3>
      <TenantServiceList :tenant-services="tenantServices" />
      <v-divider class="my-12" />
    </template>

    <h3 v-if="tenantServices.length > 0">Available Services</h3>

    <template v-if="availableServices.length > 0">
      <template v-if="tenantServices.length > 0">
        <p v-if="isTenantOwner" class="mb-8">
          Add a Connected Service, then go to Service Roles to assign roles to
          groups.
        </p>
        <p v-else>Contact a Tenant Owner to request additional services.</p>
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
