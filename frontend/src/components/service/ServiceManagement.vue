<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Service, Tenant } from '@/models'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  allServices: Service[]
  tenant: Tenant
  tenantServices: Service[]
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'add-service', serviceId: string): void // NOSONAR: S6598
}>()

// --- Component State ---------------------------------------------------------

const search = ref('')
const selectedServiceId = ref('')

// --- Computed Values ---------------------------------------------------------

const availableServices = computed(() => {
  return props.allServices.filter(
    (service) => !props.tenantServices.includes(service),
  )
})

const isTenantAdmin = computed(() => {
  return currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value)
})

// --- Component Methods -------------------------------------------------------

function handleAddService() {
  if (selectedServiceId.value) {
    emit('add-service', selectedServiceId.value)
    selectedServiceId.value = ''
  }
}
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col cols="12">
        <h4 class="mb-6 mt-12">Available Services</h4>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search"
          variant="outlined"
          clearable
          hide-details
          single-line
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-data-table
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
          :headers="[
            {
              title: 'Service',
              key: 'name',
              align: 'start',
            },
            {
              title: 'Available Since',
              key: 'createdDate',
              align: 'start',
            },
          ]"
          :items="tenantServices"
          :search="search"
          :sort-by="[{ key: 'name' }]"
          item-value="id"
          striped="even"
          fixed-header
          hover
        >
          <template #no-data>
            <v-alert type="info">{{
              search
                ? 'No services match your search criteria'
                : 'No services are currently available'
            }}</v-alert>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <template v-if="isTenantAdmin">
      <v-row class="mt-6">
        <v-col cols="12">
          <v-divider class="mb-12" />
          <h4 class="my-4">Add an available shared service to this Tenant</h4>
          <p>
            To add an available shared service to this tenant, choose one from
            the dropdown and click 'Add Service' to confirm.
          </p>
        </v-col>
      </v-row>

      <v-row class="mt-10">
        <v-col cols="6">
          <v-select
            v-model="selectedServiceId"
            :items="availableServices"
            class="my-0"
            item-title="name"
            item-value="id"
            label="Select an option..."
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col class="d-flex align-center" cols="6">
          <v-btn
            :disabled="!selectedServiceId"
            color="primary"
            @click="handleAddService"
          >
            Add Service
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>
