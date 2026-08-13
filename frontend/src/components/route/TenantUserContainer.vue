<script setup lang="ts">
import { computed, ref } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
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

const { tenantId } = defineProps<{
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
  const tenant = tenantStore.getTenant(tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`)
  }

  return tenant
})

// --- Component Methods -------------------------------------------------------

const handleAddUser = async (user: User, groups: Group[]) => {
  let addToGroups = true
  try {
    await tenantStore.addTenantUser(tenantId, user)
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
      await groupStore.addGroupUser(tenantId, group.id, user)
    }

    // Only show alert if user was added to at least one group.
    if (groups.length > 0) {
      notification.success(
        'New user successfully added to groups',
        'User Added to Groups',
      )
    }
  } catch {
    notification.error('Failed to add user to groups')
  }
}

const handleClearSearch = async () => {
  searchResults.value = null
}

const handleRemoveRole = async (userId: UserId, roleId: RoleId) => {
  try {
    await tenantStore.removeTenantUserRole(tenantId, userId, roleId)
    notification.success(
      'The role was successfully removed from the user',
      'Role Removed',
    )
  } catch {
    notification.error('Failed to remove user role')
  }
}

const handleRemoveUser = async (userId: UserId) => {
  try {
    if (!userId) {
      throw new Error('No user selected')
    }

    await tenantStore.removeTenantUser(tenantId, userId)
    notification.success('The user was successfully removed', 'User Removed')
  } catch {
    notification.error('Failed to remove user')
  }
}

const handleUserSearch = async (
  searchType: IdirSearchType,
  searchText: string,
) => {
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

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  try {
    await roleStore.fetchRoles()
  } catch {
    notification.error('Failed to load roles')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoginContainer>
    <LoadingWrapper
      :loading="!initialized"
      loading-message="Loading tenant users..."
    >
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
    </LoadingWrapper>
  </LoginContainer>
</template>
