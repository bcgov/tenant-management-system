<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { type TenantDetailFields, User } from '@/models'
import { useRoleStore, useTenantStore, useUserStore } from '@/stores'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'
import BaseSecureView from '@/views/BaseSecureView.vue'

const route = useRoute()

const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const userStore = useUserStore()

const { notification } = useNotification()

// Component Data

const isDuplicateName = ref(false)
const roles = computed(() => roleStore.roles)
const searchResults = ref<User[]>([])

// Component State

const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenants' },
  {
    title: tenant.value.name,
    disabled: false,
    href: `/tenants/${tenant.value.id}`,
  },
])

const showDetail = ref(true)
const isEditing = ref(false)
const isLoading = ref(true)
const tab = ref<number>(0)
const loadingSearch = ref(false)

// Deal with the case that someone could manually try to send in multiple route
// parameters for the tenant ID.
const routeTenantId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
)

const tenant = computed(() => {
  const found = tenantStore.getTenant(routeTenantId.value)
  if (!found) {
    throw new Error('Tenant not loaded')
  }

  return found
})

// Component Lifecycle

onMounted(async () => {
  // Fetch the tenant that is being managed.
  await tenantStore.fetchTenant(routeTenantId.value)

  // Load the possible roles, used when adding a user to the tenant.
  await roleStore.fetchRoles()

  isLoading.value = false
})

// Subcomponent Event Handlers

async function handleAddUser(user: User) {
  try {
    await tenantStore.addTenantUser(tenant.value, user)
    searchResults.value = []
    notification.success(
      'New user successfully added to this tenant',
      'User Added',
    )
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      notification.error(
        `Cannot add user "${user.ssoUser.displayName}": already a user in ` +
          `this tenant`,
      )
    } else {
      notification.error('Failed to add user')
    }

    searchResults.value = []
  }
}

async function handleClearSearch() {
  searchResults.value = []
}

async function handleRemoveRole(userId: string, roleId: string) {
  try {
    await tenantStore.removeTenantUserRole(tenant.value, userId, roleId)
    notification.success(
      'The role was successfully removed from the user',
      'Role Removed',
    )
  } catch {
    notification.error('Failed to remove user role')
  }
}

async function handleUserSearch(
  searchType: IdirSearchType,
  searchText: string,
) {
  loadingSearch.value = true

  try {
    if (searchType === IDIR_SEARCH_TYPE.FIRST_NAME.value) {
      searchResults.value = await userStore.searchIdirFirstName(searchText)
    } else if (searchType === IDIR_SEARCH_TYPE.LAST_NAME.value) {
      searchResults.value = await userStore.searchIdirLastName(searchText)
    } else if (searchType === IDIR_SEARCH_TYPE.EMAIL.value) {
      searchResults.value = await userStore.searchIdirEmail(searchText)
    } else {
      throw new Error('Invalid search type')
    }
  } catch {
    notification.error('User search failed')
    searchResults.value = []
  } finally {
    loadingSearch.value = false
  }
}

async function handleUpdateTenant(updatedTenant: TenantDetailFields) {
  try {
    tenant.value.description = updatedTenant.description
    tenant.value.ministryName = updatedTenant.ministryName
    tenant.value.name = updatedTenant.name

    await tenantStore.updateTenant(tenant.value)
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
</script>

<template>
  <BaseSecureView>
    <LoadingWrapper :loading="isLoading" loading-message="Loading tenant...">
      <BreadcrumbBar :items="breadcrumbs" class="mb-6" />

      <TenantHeader v-model:show-detail="showDetail" :tenant="tenant" />

      <TenantDetails
        v-if="showDetail"
        v-model:is-editing="isEditing"
        :is-duplicate-name="isDuplicateName"
        :tenant="tenant"
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
            <TenantUserManagement
              :loading-search="loadingSearch"
              :possible-roles="roles"
              :search-results="searchResults"
              :tenant="tenant"
              @add="handleAddUser"
              @cancel="searchResults = []"
              @clear-search="handleClearSearch"
              @remove-role="handleRemoveRole"
              @search="handleUserSearch"
            />
          </v-window-item>

          <v-window-item :value="2">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for Available Services tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card>
    </LoadingWrapper>
  </BaseSecureView>
</template>
