<script setup lang="ts">
import { mdiMagnify } from '@mdi/js'
import { computed, ref, type Ref } from 'vue'

import AdministratorContainer from '@/components/auth/AdministratorContainer.vue'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantRequestDisplay from '@/components/tenantrequest/TenantRequestDisplay.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { type TenantRequest } from '@/models/tenantrequest.model'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const tenantRequestStore = useTenantRequestStore()

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

const handleApproved = async (tenantRequest: TenantRequest, name: string) => {
  isDuplicateName.value = false

  try {
    await tenantRequestStore.updateTenantRequestStatus(
      tenantRequest.id,
      TENANT_REQUEST_STATUS.APPROVED.value,
      undefined,
      name,
    )
    notification.success('Tenant Request has been successfully updated')

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
        notification.error(
          'Requests can only have a status change from New. Start a new ' +
            'request instead',
        )

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
      notification.error('Failed to update Tenant Request')
    }
  }
}

const handleCancel = () => {
  selectedTenantRequest.value = null
  isDuplicateName.value = false
}

const handleRejected = async (tenantRequest: TenantRequest, notes: string) => {
  isDuplicateName.value = false

  try {
    await tenantRequestStore.updateTenantRequestStatus(
      tenantRequest.id,
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

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  try {
    await tenantRequestStore.fetchTenantRequests()
  } catch {
    notification.error('Failed to load tenant request data')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoginContainer>
    <AdministratorContainer>
      <LoadingWrapper
        :loading="!initialized"
        loading-message="Loading tenant requests..."
      >
        <v-container>
          <template v-if="selectedTenantRequest">
            <TenantRequestDisplay
              :is-duplicate-name="isDuplicateName"
              :tenant-request="selectedTenantRequest"
              @approved="(name) => handleApproved(selectedTenantRequest!, name)"
              @cancel="handleCancel"
              @clear-duplicate-error="isDuplicateName = false"
              @rejected="
                (notes) => handleRejected(selectedTenantRequest!, notes)
              "
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
                  v-if="tenantRequests.length > 0"
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
                  :hide-default-footer="tenantRequests.length === 0"
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
                    <EmptyState
                      v-if="search"
                      body="Change your search criteria to match tenant requests"
                      title="No matching tenant requests"
                      variant="lookup"
                    />
                    <EmptyState
                      v-else
                      body="Tenant requests submitted by users will appear here"
                      title="No tenant requests yet"
                      variant="lookup"
                    />
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
      </LoadingWrapper>
    </AdministratorContainer>
  </LoginContainer>
</template>
