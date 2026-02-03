<script setup lang="ts">
import { ref } from 'vue'

import GroupUserManagement from '@/components/group/GroupUserManagement.vue'
import { useNotification } from '@/composables'
import { DuplicateEntityError } from '@/errors'
import { Group, Tenant, User } from '@/models'
import { useGroupStore, useUserStore } from '@/stores'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  group: Group
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const userStore = useUserStore()

// --- Component State ---------------------------------------------------------

const isLoadingSearch = ref(false)
const searchResults = ref<User[] | null>(null)

// --- Component Methods -------------------------------------------------------

async function handleAddUser(user: User) {
  try {
    await groupStore.addGroupUser(props.tenant.id, props.group.id, user)
    searchResults.value = null
    notification.success(
      'New user successfully added to this group',
      'User Added',
    )
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      notification.error(
        `Cannot add user "${user.ssoUser.displayName}": already a user in ` +
          `this group`,
      )
      searchResults.value = null
    } else {
      notification.error('Failed to add user to group')
    }
  }
}

async function handleClearSearch() {
  searchResults.value = null
}

async function handleDeleteUser(groupUserId: string) {
  try {
    await groupStore.removeGroupUser(
      props.tenant.id,
      props.group.id,
      groupUserId,
    )
    notification.success(
      'User successfully removed from this group',
      'User Removed',
    )
  } catch {
    notification.error('Failed to remove user from group')
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
      searchResults.value = searchResults.value.concat(await userStore.searchBCeIDDisplayName(searchText))
    } else if (searchType === IDIR_SEARCH_TYPE.LAST_NAME.value) {
      searchResults.value = await userStore.searchIdirLastName(searchText)
      searchResults.value = searchResults.value.concat(await userStore.searchBCeIDDisplayName(searchText))
    } else if (searchType === IDIR_SEARCH_TYPE.EMAIL.value) {
      searchResults.value = await userStore.searchIdirEmail(searchText)
      searchResults.value = searchResults.value.concat(await userStore.searchBCeIDEmail(searchText))
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
</script>

<template>
  <GroupUserManagement
    :group="group"
    :loading-search="isLoadingSearch"
    :search-results="searchResults"
    :tenant="tenant"
    @add="handleAddUser"
    @cancel="searchResults = null"
    @clear-search="handleClearSearch"
    @delete="handleDeleteUser"
    @search="handleUserSearch"
  />
</template>
