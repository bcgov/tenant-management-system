<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import ServiceManagementContainer from '@/components/service/ServiceManagementContainer.vue'
import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import UserManagementContainer from '@/components/tenant/UserManagementContainer.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { type TenantDetailFields } from '@/models'
import { useTenantStore } from '@/stores'

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const isDuplicateName = ref(false)
const isEditing = ref(false)
const showDetail = ref(true)
const tab = ref<number>(0)

// --- Computed Values ---------------------------------------------------------

const breadcrumbs = computed(() => {
  // Shouldn't happen as the template can't call this function when null.
  if (!tenant.value) {
    return []
  }

  return [
    { title: 'Tenants', disabled: false, href: '/tenants' },
    {
      title: tenant.value.name,
      disabled: false,
      href: `/tenants/${routeTenantId.value}`,
    },
  ]
})

const routeTenantId = computed(() =>
  Array.isArray(route.params.tenantId)
    ? route.params.tenantId[0]
    : route.params.tenantId,
)

const tenant = computed(() => {
  return tenantStore.getTenant(routeTenantId.value) || null
})

// --- Component Methods -------------------------------------------------------

async function handleUpdateTenant(updatedTenant: TenantDetailFields) {
  // Shouldn't happen as the template can't call this function when null.
  if (!tenant.value) {
    return
  }

  try {
    await tenantStore.updateTenantDetails(tenant.value.id, updatedTenant)
    isEditing.value = false
  } catch (error) {
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
      notification.error('Failed to update the tenant')
    }
  }
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await tenantStore.fetchTenant(routeTenantId.value)
  } catch {
    notification.error('Failed to load tenant')
  }
})
</script>

<template>
  <LoginContainer>
    <LoadingWrapper :loading="!tenant" loading-message="Loading tenant...">
      <BreadcrumbBar :items="breadcrumbs" class="mb-6" />

      <TenantHeader v-model:show-detail="showDetail" :tenant="tenant!" />

      <TenantDetails
        v-if="showDetail"
        v-model:is-editing="isEditing"
        :is-duplicate-name="isDuplicateName"
        :tenant="tenant!"
        @clear-duplicate-error="isDuplicateName = false"
        @update="handleUpdateTenant"
      />

      <v-card class="mt-6" elevation="0">
        <v-tabs v-model="tab" :disabled="isEditing" :mandatory="false">
          <!-- The v-tabs component insists on always having an active tab. Use
           an invisible Tab 0 to make v-tabs happy. -->
          <v-tab :value="0" class="pa-0 ma-0" style="min-width: 0px" />
          <v-tab :value="1">User Management</v-tab>
          <v-tab :value="2">Available Services</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0" />

          <v-window-item :value="1">
            <UserManagementContainer :tenant="tenant!" />
          </v-window-item>

          <v-window-item :value="2">
            <ServiceManagementContainer :tenant="tenant!" />
          </v-window-item>
        </v-window>
      </v-card>
    </LoadingWrapper>
  </LoginContainer>
</template>
