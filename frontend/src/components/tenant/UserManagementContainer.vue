<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import { useNotification } from '@/composables'
import { DuplicateEntityError } from '@/errors'
import { Tenant, User } from '@/models'
import { useRoleStore, useTenantStore, useUserStore } from '@/stores'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const userStore = useUserStore()

// --- Component State ---------------------------------------------------------

const isLoadingSearch = ref(false)
const searchResults = ref<User[] | null>(null)

// --- Computed Values ---------------------------------------------------------

const roles = computed(() => roleStore.roles)

// --- Component Methods -------------------------------------------------------

async function handleAddUser(user: User) {
  try {
    await tenantStore.addTenantUser(props.tenant, user)
    searchResults.value = null
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
      searchResults.value = null
    } else {
      notification.error('Failed to add user')
    }
  }
}

async function handleClearSearch() {
  searchResults.value = null
}

async function handleRemoveRole(userId: string, roleId: string) {
  try {
    await tenantStore.removeTenantUserRole(props.tenant, userId, roleId)
    notification.success(
      'The role was successfully removed from the user',
      'Role Removed',
    )
  } catch {
    notification.error('Failed to remove user role')
  }
}

async function handleRemoveUser(userId: string | undefined) {
  try {
    if (!userId) throw new Error('No user selected')
    await tenantStore.removeTenantUser(props.tenant.id, userId)
    notification.success('The user was successfully removed', 'User Removed')
  } catch {
    notification.error('Failed to remove user')
  }
}

async function handleUserSearch(
  searchType: IdirSearchType,
  searchText: string,
) {
  isLoadingSearch.value = true

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
    searchResults.value = null
  } finally {
    isLoadingSearch.value = false
  }
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await roleStore.fetchRoles()
  } catch {
    notification.error('Failed to load roles')
  }
})
</script>

<template>
  <TenantUserManagement
    :loading-search="isLoadingSearch"
    :possible-roles="roles"
    :search-results="searchResults"
    :tenant="tenant"
    @add="handleAddUser"
    @cancel="searchResults = null"
    @clear-search="handleClearSearch"
    @remove-role="handleRemoveRole"
    @remove-user="handleRemoveUser"
    @search="handleUserSearch"
  />
</template>
