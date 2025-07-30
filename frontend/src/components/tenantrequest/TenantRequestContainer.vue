<script setup lang="ts">
import { computed, onMounted, ref, type Ref } from 'vue'

import TenantRequestDisplay from '@/components/tenantrequest/TenantRequestDisplay.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import type { TenantRequest } from '@/models'
import { useTenantRequestStore } from '@/stores'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

const { notification } = useNotification()
const tenantRequestStore = useTenantRequestStore()

const search = ref('')
const selectedTenantRequest: Ref<TenantRequest | null> = ref(null)

const tenantRequests = computed(() => tenantRequestStore.tenantRequests)

// Component Lifecycle

onMounted(async () => {
  try {
    await tenantRequestStore.fetchTenantRequests()
  } catch {
    notification.error('Failed to load tenant request data')
  }
})

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'new':
      return 'info'
    case 'rejected':
      return 'error'
    default:
      return 'info'
  }
}

const handleRowClick = (_event: Event, { item }: { item: TenantRequest }) => {
  selectedTenantRequest.value = item
}

const handleBackToList = () => {
  selectedTenantRequest.value = null
}

const handleApproved = async () => {
  if (!selectedTenantRequest.value) {
    return
  }

  try {
    await tenantRequestStore.updateTenantRequestStatus(
      selectedTenantRequest.value.id,
      TENANT_REQUEST_STATUS.APPROVED.value,
    )
    notification.success('Tenant Request has been successfully updated')
    handleBackToList()
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      notification.error(
        'Tenant Request cannot be approved because the name already exists',
      )
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      notification.error(error.userMessage)
    } else {
      // Otherwise display a generic error message.
      notification.error('Failed to update Tenant Request')
    }
  }
}

const handleRejected = async (notes: string) => {
  if (!selectedTenantRequest.value) {
    return
  }

  try {
    await tenantRequestStore.updateTenantRequestStatus(
      selectedTenantRequest.value.id,
      TENANT_REQUEST_STATUS.REJECTED.value,
      notes,
    )
    notification.success('Tenant Request has been successfully updated')
    handleBackToList()
  } catch {
    notification.error('Failed to update Tenant Request')
  }
}
</script>

<template>
  <v-container class="px-0" fluid>
    <template v-if="selectedTenantRequest">
      <TenantRequestDisplay
        :tenant-request="selectedTenantRequest"
        @approved="handleApproved"
        @back="handleBackToList"
        @rejected="handleRejected"
      />
    </template>

    <template v-else>
      <v-row>
        <v-col cols="12">
          <h4 class="mb-6 mt-12">Tenant Requests</h4>
          <p class="mb-8">
            Click a row in the table to approve, deny, or to see more details.
          </p>
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
            :cell-props="
              ({ column }) => ({
                class: column.key === 'status' ? 'text-right' : 'text-left',
              })
            "
            :header-props="{
              class: 'text-body-1 font-weight-bold bg-surface-light',
            }"
            :headers="[
              {
                key: 'createdDate',
                title: 'Date of Request (YYYY-MM-DD)',
              },
              {
                key: 'createdBy',
                sortable: false,
                title: 'User Name (IDIR)',
              },
              {
                key: 'ministryName',
                title: 'Ministry / Organization',
              },
              {
                key: 'name',
                sortable: false,
                title: 'Requested Tenant Name',
              },
              {
                align: 'end',
                key: 'status',
                title: 'Status',
              },
            ]"
            :items="tenantRequests"
            :search="search"
            :sort-by="[{ key: 'createdDate' }]"
            item-value="id"
            striped="even"
            fixed-header
            hover
            @click:row="handleRowClick"
          >
            <template #no-data>
              <v-alert type="info">{{
                search
                  ? 'No tenant requests match your search criteria'
                  : 'There are no tenant requests'
              }}</v-alert>
            </template>
            <template #[`item.status`]="{ item }">
              <div
                class="d-flex flex-wrap justify-end"
                style="gap: 8px; margin-block: 4px"
              >
                <v-chip
                  :color="getStatusColor(item.status)"
                  class="d-inline-flex align-center"
                >
                  {{ item.status }}
                </v-chip>
              </div>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>
