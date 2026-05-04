<script setup lang="ts">
import { mdiMagnify } from '@mdi/js'
import { computed, onMounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import TenantRequestDisplay from '@/components/tenantrequest/TenantRequestDisplay.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { type TenantRequest } from '@/models/tenantrequest.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

const { t } = useI18n()

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const notification = useNotification()
const tenantRequestStore = useTenantRequestStore()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const isDuplicateName = ref(false)
const search = ref('')
const selectedTenantRequest: Ref<TenantRequest | null> = ref(null)

// --- Computed Values ---------------------------------------------------------

const tenantRequests = computed(() => tenantRequestStore.tenantRequests)

// --- Component Methods -------------------------------------------------------

const getCellProps = ({ column }: { column: { key: string } }) => ({
  class: column.key === 'status' ? 'text-right' : 'text-left',
})

const getStatusColor = (status: string) => {
  switch (status) {
    case TENANT_REQUEST_STATUS.APPROVED.value:
      return 'success'
    case TENANT_REQUEST_STATUS.NEW.value:
      return 'info'
    case TENANT_REQUEST_STATUS.REJECTED.value:
      return 'error'
    default:
      return 'warning'
  }
}

const handleApproved = async (name: string) => {
  isDuplicateName.value = false
  if (!selectedTenantRequest.value) {
    return
  }

  try {
    await tenantRequestStore.updateTenantRequestStatus(
      selectedTenantRequest.value.id,
      TENANT_REQUEST_STATUS.APPROVED.value,
      undefined,
      name,
    )
    notification.success('Tenant Request has been successfully updated')
    await tenantStore.fetchTenants(authStore.authenticatedUser.id)
    handleCancel()
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      // TODO - this should be handled better by the API. The API should return
      // a specific error code, not some string that needs parsing. This is
      // brittle and can easily break if the API error message changes - and it
      // is currently broken.
      if (
        error.userMessage &&
        error.userMessage.includes('Cannot update tenant request with status')
      ) {
        // If the API says that this name exists already, then show the name
        // duplicated validation error.
        notification.error(t('tenants.errors.nonNewStatusChange'))

        return
      }

      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      notification.error(error.userMessage)
    } else {
      // Otherwise display a generic error message.
      notification.error(t('tenants.errors.genericRequestError'))
    }
  }
}

const handleCancel = () => {
  selectedTenantRequest.value = null
  isDuplicateName.value = false
}

const handleRejected = async (notes: string) => {
  isDuplicateName.value = false
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
    handleCancel()
  } catch {
    notification.error('Failed to update Tenant Request')
  }
}

const handleRowClick = (_event: Event, { item }: { item: TenantRequest }) => {
  selectedTenantRequest.value = item
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await tenantRequestStore.fetchTenantRequests()
  } catch {
    notification.error('Failed to load tenant request data')
  }
})
</script>

<template>
  <v-container class="px-0" fluid>
    <template v-if="selectedTenantRequest">
      <TenantRequestDisplay
        :is-duplicate-name="isDuplicateName"
        :tenant-request="selectedTenantRequest"
        @approved="handleApproved"
        @cancel="handleCancel"
        @clear-duplicate-error="isDuplicateName = false"
        @rejected="handleRejected"
      />
    </template>

    <template v-else>
      <v-row>
        <v-col cols="12">
          <h4 class="mb-6 mt-12">Tenant Requests</h4>
          <p class="mb-8">
            Select a request to review details and approve or reject it.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="4">
          <v-text-field
            v-model="search"
            :append-inner-icon="mdiMagnify"
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
            :cell-props="getCellProps"
            :header-props="{
              class: 'bg-surface-light font-weight-bold text-body-small',
            }"
            :headers="[
              {
                key: 'createdDate',
                title: 'Date of Request (YYYY-MM-DD)',
              },
              {
                key: 'createdBy',
                sortable: false,
                title: 'Requested By',
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
            :sort-by="[{ key: 'createdDate', order: 'desc' }]"
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
                  class="align-center d-inline-flex"
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
