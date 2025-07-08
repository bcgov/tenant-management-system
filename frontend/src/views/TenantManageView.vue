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
import { Tenant, type TenantEditFields, User } from '@/models'
import { useRoleStore, useTenantStore, useUserStore } from '@/stores'
import BaseSecureView from '@/views/BaseSecureView.vue'

const route = useRoute()

const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const userStore = useUserStore()

const { addNotification } = useNotification()

// Component Data

const isDuplicateName = ref(false)
const isLoading = ref(true)
const roles = computed(() => roleStore.roles)
const searchResults = ref<User[]>([])

// Use the tenantReference for the data in the store, which is loaded when the
// component is mounted. TypeScript can't track the Vue lifecycle timing, so it
// doesn't know that this is populated before handlers run. The computed wrapper
// avoids doing null checks everywhere.
const tenantReference = ref<Tenant>()
const tenant = computed(() => {
  if (!tenantReference.value) {
    throw new Error('Tenant not loaded')
  }

  return tenantReference.value
})

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
const deleteDialogVisible = ref(false)
const isEditing = ref(false)
const tab = ref<number>(0)
const loadingSearch = ref(false)

// Component Lifecycle

onMounted(async () => {
  // Load the tenant that is being managed.
  tenantReference.value = await tenantStore.fetchTenant(
    route.params.id as string,
  )

  // Load the possible roles, used when adding a user to the tenant.
  await roleStore.fetchRoles()

  isLoading.value = false
})

// Subcomponent Event Handlers

async function handleAddUser(user: User) {
  try {
    await tenantStore.addTenantUser(tenant.value, user)
    searchResults.value = []
    addNotification('User added successfully')
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      addNotification(
        `Cannot add user "${user.ssoUser.displayName}": already a user in ` +
          `this tenant`,
        'error',
      )
    } else {
      addNotification('Failed to add user', 'error')
    }

    searchResults.value = []
  }
}

async function handleClearSearch() {
  searchResults.value = []
}

async function handleRemoveRole({
  userId,
  roleId,
}: {
  userId: string
  roleId: string
}) {
  try {
    await tenantStore.removeTenantUserRole(tenant.value, userId, roleId)
    addNotification('The role was successfully removed from the user.')

    // Refresh local tenant data to reflect role removal
    tenantReference.value = await tenantStore.fetchTenant(tenant.value.id)
  } catch {
    addNotification('Failed to remove user role', 'error')
  }
}

async function handleUserSearch(query: Record<string, string>) {
  loadingSearch.value = true
  try {
    searchResults.value = await userStore.searchIdirUsers(query)
  } catch {
    addNotification('User search failed', 'error')
    searchResults.value = []
  } finally {
    loadingSearch.value = false
  }
}

async function handleUpdateTenant(updatedTenant: TenantEditFields) {
  try {
    tenant.value.description = updatedTenant.description
    tenant.value.ministryName = updatedTenant.ministryName
    tenant.value.name = updatedTenant.name

    tenantReference.value = await tenantStore.updateTenant(tenant.value)
    isEditing.value = false
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message.
      addNotification(error.userMessage, 'error')
    } else {
      // Otherwise display a generic error message.
      addNotification('Failed to update the tenant', 'error')
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
        v-model:delete-dialog="deleteDialogVisible"
        v-model:is-editing="isEditing"
        :is-duplicate-name="isDuplicateName"
        :tenant="tenant"
        @clear-duplicate-error="isDuplicateName = false"
        @update="handleUpdateTenant"
      />

      <!-- Inlined Tabs -->
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
