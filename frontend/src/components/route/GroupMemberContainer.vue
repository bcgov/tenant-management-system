<script setup lang="ts">
import { computed, ref } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupMemberManagement from '@/components/group/GroupMemberManagement.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { type GroupId } from '@/models/group.model'
import { type GroupUserId } from '@/models/groupuser.model'
import { type TenantId } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useUserSearchStore } from '@/stores/useUserSearchStore'
import { type IdirSearchType } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const { groupId, tenantId } = defineProps<{
  groupId: GroupId
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const tenantStore = useTenantStore()
const userSearchStore = useUserSearchStore()

// --- Component State ---------------------------------------------------------

const isLoadingSearch = ref(false)
const searchResults = ref<User[] | null>(null)

// --- Computed Values ---------------------------------------------------------

const group = computed(() => groupStore.getGroup(groupId))
const tenant = computed(() => tenantStore.getTenant(tenantId))

// --- Component Methods -------------------------------------------------------

const handleAddMember = async (user: User) => {
  try {
    await groupStore.addGroupUser(tenantId, groupId, user)
    searchResults.value = null
    notification.success(
      'New member successfully added to this group',
      'Member Added',
    )
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      notification.error(
        `Cannot add member "${user.ssoUser.displayName}": already a member ` +
          `in this group`,
      )
      searchResults.value = null
    } else {
      notification.error('Failed to add member to group')
    }
  }
}

const handleClearSearch = async () => {
  searchResults.value = null
}

const handleDeleteMember = async (groupUserId: GroupUserId) => {
  try {
    await groupStore.removeGroupUser(tenantId, groupId, groupUserId)
    notification.success(
      'Member successfully removed from this group',
      'Member Removed',
    )
  } catch {
    notification.error('Failed to remove member from group')
  }
}

const handleUserSearch = async (
  searchType: IdirSearchType,
  searchText: string,
) => {
  isLoadingSearch.value = true

  try {
    searchResults.value = await userSearchStore.searchUsers(
      searchType,
      searchText,
    )
  } catch {
    notification.error('User search failed')
    searchResults.value = null
  } finally {
    isLoadingSearch.value = false
  }
}
</script>

<template>
  <LoginContainer>
    <GroupMemberManagement
      :group="group!"
      :loading-search="isLoadingSearch"
      :search-results="searchResults"
      :tenant="tenant!"
      @add="handleAddMember"
      @cancel="searchResults = null"
      @clear-search="handleClearSearch"
      @delete="handleDeleteMember"
      @search="handleUserSearch"
    />
  </LoginContainer>
</template>
