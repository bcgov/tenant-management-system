<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantList from '@/components/tenant/TenantList.vue'
import TenantRequestDialog from '@/components/tenantrequest/TenantRequestDialog.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { Tenant } from '@/models/tenant.model'
import { type TenantRequestDetailFields } from '@/models/tenantrequest.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const notification = useNotification()
const router = useRouter()
const tenantRequestStore = useTenantRequestStore()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

// Dialog visibility state
const dialogVisible = ref(false)

// Special dialog validation for uniqueness of the name.
const isDuplicateName = ref(false)

// --- Computed Values ---------------------------------------------------------

const tenants = computed(() => tenantStore.tenants)

// --- Component Methods -------------------------------------------------------

const dialogClose = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

const dialogOpen = () => (dialogVisible.value = true)

const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}/users`)
}

const handleTenantSubmit = async (
  tenantRequestDetails: TenantRequestDetailFields,
) => {
  try {
    await tenantRequestStore.createTenantRequest(
      tenantRequestDetails,
      authStore.authenticatedUser,
    )
    notification.success('Request successfully submitted')
    isDuplicateName.value = false
    dialogClose()
  } catch (error: unknown) {
    if (error instanceof DuplicateEntityError) {
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
      notification.error('Failed to create the new tenant')
    }
  }
}

// --- Component Lifecycle -----------------------------------------------------

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const init = async () => {
  try {
    await tenantStore.fetchTenants(authStore.authenticatedUser.id)
  } catch {
    notification.error('Failed to load tenants')
  }
}

init()
</script>

<template>
  <LoginContainer>
    <v-container v-if="tenants.length === 0" class="fill-height">
      <v-row class="center-align justify-center">
        <v-col class="align-center d-flex flex-column" cols="auto">
          <h1>No tenants yet</h1>
          <p class="p-large">You don't currently have access to a tenant.</p>

          <p>
            <ButtonPrimary text="Request a Tenant" @click="dialogOpen" />
          </p>

          <span class="mt-12 p-small">
            If your team already has a tenant, ask a tenant owner or user admin
            to add you.
          </span>
          <span class="p-small">
            <em>Requests are reviewed by the CSTAR team.</em>
          </span>
        </v-col>
      </v-row>
    </v-container>
    <template v-else>
      <v-row class="mb-8 mt-12">
        <v-col cols="12">
          <ButtonPrimary text="Request a Tenant" @click="dialogOpen" />
        </v-col>
      </v-row>
      <TenantList :tenants="tenants" @select="handleCardClick" />
    </template>
  </LoginContainer>

  <TenantRequestDialog
    v-model="dialogVisible"
    :is-duplicate-name="isDuplicateName"
    @clear-duplicate-error="isDuplicateName = false"
    @submit="handleTenantSubmit"
  />
</template>
