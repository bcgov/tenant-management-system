<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import TenantCreateDialog from '@/components/tenant/TenantCreateDialog.vue'
import TenantList from '@/components/tenant/TenantList.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { Tenant, type TenantEditFields } from '@/models'
import { useAuthStore, useTenantStore } from '@/stores'
import BaseSecureView from '@/views/BaseSecureView.vue'

// Router
const router = useRouter()
const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

// User notification creation
const { addNotification } = useNotification()

// Stores
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const { loading, tenants } = storeToRefs(tenantStore)

// Special dialog validation for uniqueness of the name.
const isDuplicateName = ref(false)

// Dialog visibility state
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

// Fetch tenants on load
onMounted(async () => {
  try {
    await tenantStore.fetchTenants(authStore.authenticatedUser.id)
  } catch {
    addNotification('Failed to fetch tenants', 'error')
  }
})

// Submit handler
const handleTenantSubmit = async (tenantDetails: TenantEditFields) => {
  try {
    await tenantStore.requestTenant(tenantDetails, authStore.authenticatedUser)
    addNotification(
      'Your request for a new tenant has been sent to the Tenant Management ' +
        "System administrator. You'll be notified of the outcome within 48 " +
        'hours.',
      'success',
    )
    isDuplicateName.value = false
    closeDialog()
  } catch (error: unknown) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      addNotification(error.userMessage, 'error')
    } else {
      // Otherwise display a generic error message.
      addNotification('Failed to create the new tenant', 'error')
    }
  }
}
</script>

<template>
  <BaseSecureView>
    <LoadingWrapper :loading="loading" loading-message="Loading tenants...">
      <v-row class="mb-8">
        <v-col cols="12">
          <ButtonPrimary text="Request New Tenant" @click="openDialog" />
        </v-col>
      </v-row>

      <TenantList :tenants="tenants" @select="handleCardClick" />
    </LoadingWrapper>

    <TenantCreateDialog
      v-model="dialogVisible"
      :is-duplicate-name="isDuplicateName"
      @clear-duplicate-error="isDuplicateName = false"
      @submit="handleTenantSubmit"
    />
  </BaseSecureView>
</template>
