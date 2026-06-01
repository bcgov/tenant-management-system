<script setup lang="ts">
import { computed, ref } from 'vue'

import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { Group } from '@/models/group.model'
import { type RoleId } from '@/models/role.model'
import { type TenantId } from '@/models/tenant.model'
import { User, type UserId } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useUserStore } from '@/stores/useUserStore'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const userStore = useUserStore()

// --- Component State ---------------------------------------------------------

const isLoadingSearch = ref(false)
const searchResults = ref<User[] | null>(null)

// --- Computed Values ---------------------------------------------------------

const roles = computed(() => roleStore.roles)

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(props.tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${props.tenantId} not found`)
  }

  return tenant
})

// --- Component Methods -------------------------------------------------------

async function handleAddUser(user: User, groups: Group[]) {
  let addToGroups = true
  try {
    await tenantStore.addTenantUser(props.tenantId, user)
    searchResults.value = null
    notification.success(
      'New user successfully added to this tenant',
      'User Added',
    )
  } catch (error) {
    addToGroups = false
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

  if (!addToGroups) {
    return
  }

  try {
    for (const group of groups) {
      await groupStore.addGroupUser(props.tenantId, group.id, user)
    }

    // Only show alert if user was added to at least one group.
    if (groups.length > 0) {
      notification.success(
        'New user succesfully added to groups',
        'User Added to Groups',
      )
    }
  } catch {
    notification.error('Failed to add user to groups')
  }
}

async function handleClearSearch() {
  searchResults.value = null
}

async function handleRemoveRole(userId: UserId, roleId: RoleId) {
  try {
    await tenantStore.removeTenantUserRole(props.tenantId, userId, roleId)
    notification.success(
      'The role was successfully removed from the user',
      'Role Removed',
    )
  } catch {
    notification.error('Failed to remove user role')
  }
}

// TODO: why would you remove user for an undefined?
async function handleRemoveUser(userId: UserId | undefined) {
  try {
    if (!userId) {
      throw new Error('No user selected')
    }

    await tenantStore.removeTenantUser(props.tenantId, userId)
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
      searchResults.value = searchResults.value.concat(
        await userStore.searchBCeIDDisplayName(searchText),
      )
    } else if (searchType === IDIR_SEARCH_TYPE.LAST_NAME.value) {
      searchResults.value = await userStore.searchIdirLastName(searchText)
      searchResults.value = searchResults.value.concat(
        await userStore.searchBCeIDDisplayName(searchText),
      )
    } else if (searchType === IDIR_SEARCH_TYPE.EMAIL.value) {
      searchResults.value = await userStore.searchIdirEmail(searchText)
      searchResults.value = searchResults.value.concat(
        await userStore.searchBCeIDEmail(searchText),
      )
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

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const init = async () => {
  try {
    await roleStore.fetchRoles()
  } catch {
    notification.error('Failed to load roles')
  }
}

init()
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
