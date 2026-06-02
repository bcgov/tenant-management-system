<script setup lang="ts">
import { mdiCircle, mdiMagnify } from '@mdi/js'
import { computed, ref } from 'vue'

import AdministratorContainer from '@/components/auth/AdministratorContainer.vue'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import ServiceForm from '@/components/service/ServiceForm.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import type { ServiceDetailFields } from '@/models/service.model'
import { useServiceStore } from '@/stores/useServiceStore'

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const serviceStore = useServiceStore()

// --- Component State ---------------------------------------------------------

const isAdding = ref(false)
const isDuplicateName = ref(false)
const search = ref('')

// --- Computed Values ---------------------------------------------------------

const services = computed(() => serviceStore.services)

// --- Component Methods -------------------------------------------------------

const handleAddService = async () => {
  isAdding.value = true
}

const handleCancel = () => {
  isAdding.value = false
  isDuplicateName.value = false
}

const handleSubmit = async (serviceDetails: ServiceDetailFields) => {
  isDuplicateName.value = false

  try {
    await serviceStore.createService(serviceDetails)
    notification.success('Service has been successfully created')

    handleCancel()
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      notification.error(error.userMessage)
    } else {
      // Otherwise display a generic error message.
      notification.error('Failed to create Service')
    }
  }
}

// --- Component Lifecycle -----------------------------------------------------

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const init = async () => {
  try {
    await serviceStore.fetchServices()
  } catch {
    notification.error('Failed to load service data')
  }
}

init()
</script>

<template>
  <LoginContainer>
    <AdministratorContainer>
      <LoadingWrapper
        :loading="serviceStore.loading"
        loading-message="Loading services..."
      >
        <v-container>
          <template v-if="isAdding">
            <ServiceForm
              :is-duplicate-name="isDuplicateName"
              @cancel="handleCancel"
              @clear-duplicate-error="isDuplicateName = false"
              @submit="handleSubmit"
            />
          </template>
          <template v-else>
            <v-row>
              <v-col cols="12">
                <h4 class="mb-6 mt-12">Connected Services</h4>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-if="services.length > 0"
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
                  :header-props="{
                    class: 'bg-surface-light font-weight-bold text-body-small',
                  }"
                  :headers="[
                    {
                      key: 'displayName',
                      title: 'Connected Service',
                    },
                    {
                      key: 'status',
                      title: 'Status',
                    },
                    {
                      key: 'updatedDate',
                      title: 'Last Synced',
                    },
                  ]"
                  :hide-default-footer="services.length === 0"
                  :items="services"
                  :search="search"
                  :sort-by="[{ key: 'displayName', order: 'asc' }]"
                  item-value="id"
                  striped="even"
                  fixed-header
                >
                  <template #no-data>
                    <v-sheet v-if="search" class="mb-6" color="surface-white">
                      <h5 class="mb-2">No matching services</h5>
                      <p class="mt-0">
                        Change your search criteria to match services
                      </p>
                    </v-sheet>
                    <v-sheet v-else class="mb-6" color="surface-white">
                      <h5 class="mb-2">No Connected Services yet</h5>
                      <p class="mt-0">
                        Connected services allow CSTAR to manage service roles
                        and access across tenants.
                      </p>
                      <ButtonPrimary
                        text="Add Connected Service"
                        @click="handleAddService"
                      />
                    </v-sheet>
                  </template>

                  <template #[`item.status`]>
                    <v-icon :icon="mdiCircle" color="success" />
                    Enabled
                  </template>
                </v-data-table>
              </v-col>
            </v-row>

            <ButtonPrimary
              v-if="services.length > 0"
              class="mt-6"
              text="Add Connected Service"
              @click="handleAddService"
            />
          </template>
        </v-container>
      </LoadingWrapper>
    </AdministratorContainer>
  </LoginContainer>
</template>
