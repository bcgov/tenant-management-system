<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantList from '@/components/tenant/TenantList.vue'
import TenantRequestDialog from '@/components/tenantrequest/TenantRequestDialog.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { Tenant, type TenantRequestDetailFields } from '@/models'
import { useAuthStore, useTenantRequestStore, useTenantStore } from '@/stores'

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

// --- Component Methods -------------------------------------------------------

const dialogClose = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

const dialogOpen = () => (dialogVisible.value = true)

const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

const handleTenantSubmit = async (
  tenantRequestDetails: TenantRequestDetailFields,
) => {
  try {
    await tenantRequestStore.createTenantRequest(
      tenantRequestDetails,
      authStore.authenticatedUser,
    )
    notification.success(
      'Your request for a new tenant has been sent to the Tenant Management ' +
        "System administrator. You'll be notified of the outcome within 48 " +
        'hours.',
      'Request successully submitted',
    )
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

onMounted(async () => {
  try {
    await tenantStore.fetchTenants(authStore.authenticatedUser.id)
  } catch(e: Error) {
    // This happens when the user has sat on a screen idle for a while and then tries to do something (but session is dead)
    if (e && e.code && e.code === "ERR_NETWORK") {
      console.error("Network error while fetching tenants:", e)
      authStore.authenticated = false;
    } else {
      notification.error('Failed to fetch tenants')
    }
  }
})
</script>

<template>
  <LoginContainer>
    <LoadingWrapper
      :loading="!tenantStore.tenants"
      loading-message="Loading tenants..."
    >
      <v-row class="mb-8">
        <v-col cols="12">
          <ButtonPrimary text="Request New Tenant" @click="dialogOpen" />
        </v-col>
      </v-row>

      <TenantList :tenants="tenantStore.tenants" @select="handleCardClick" />
    </LoadingWrapper>

    <TenantRequestDialog
      v-model="dialogVisible"
      :is-duplicate-name="isDuplicateName"
      @clear-duplicate-error="isDuplicateName = false"
      @submit="handleTenantSubmit"
    />
  </LoginContainer>
</template>
