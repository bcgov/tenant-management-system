<script setup lang="ts">
import { mdiPlusBox } from '@mdi/js'
import { computed, ref } from 'vue'

import UserSearch from '@/components/group/UserSearch.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import type { Group, GroupUser, Tenant, User } from '@/models'
import { type IdirSearchType, ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'
import UserTable from '../user/UserTable.vue'
import { GroupUser as GroupUserModel } from '@/models'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  group: Group
  loadingSearch: boolean
  searchResults: User[] | null
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'add', user: User): void
  (event: 'cancel' | 'clear-search'): void
  (event: 'delete', userId: string): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
}>()

// --- Component State ---------------------------------------------------------

const groupUserToDelete = ref<GroupUser | null>(null)
const showDeleteDialog = ref(false)
const showSearch = ref(false)

// --- Computed Values ---------------------------------------------------------

const deleteDialogButtons = computed(() => [
  {
    text: 'Cancel',
    action: 'cancel',
    type: 'secondary' as const,
  },
  {
    text: 'Confirm Removal',
    action: 'confirm',
    type: 'primary' as const,
  },
])

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

// --- Component Methods -------------------------------------------------------

function handleAddUser(user: User) {
  emit('add', user)
  toggleSearch()
}

function handleCancel() {
  emit('cancel')
  toggleSearch()
}

function handleClearSearch() {
  emit('clear-search')
}

function handleDeleteClick(user: User) {
  const groupUser = new GroupUserModel(user.id, user)

  showDeleteDialog.value = true
  groupUserToDelete.value = groupUser
}

function handleDeleteDialogAction(action: string) {
  if (action === 'confirm' && groupUserToDelete.value) {
    emit('delete', groupUserToDelete.value.id)
  }

  showDeleteDialog.value = false
  groupUserToDelete.value = null
}

function handleSearch(searchType: IdirSearchType, searchText: string) {
  emit('search', searchType, searchText)
}

function toggleSearch() {
  showSearch.value = !showSearch.value
}
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col :cols="12">
        <h4 class="mb-6 mt-12">Group Members</h4>
        <UserTable
          :show-actions="isUserAdmin"
          :show-offboard-dialog="handleDeleteClick"
          :tenant="tenant"
          :users="group.groupUsers"
          where="group"
          @add-first-clicked="toggleSearch"
        />
      </v-col>
    </v-row>

    <v-row
      v-if="isUserAdmin && !showSearch && group?.groupUsers?.length > 0"
      class="mt-4"
    >
      <v-col class="d-flex justify-start" cols="12">
        <FloatingActionButton
          :icon="mdiPlusBox"
          text="Add User to Group"
          @click="toggleSearch"
        />
      </v-col>
    </v-row>

    <v-expand-transition>
      <div v-if="showSearch">
        <v-divider class="my-12" />

        <h4 class="mb-4">Add a user to this Group</h4>

        <p class="mb-2 mt-8">
          1. Search for a user based on the selection criteria below:
        </p>

        <UserSearch
          :loading="loadingSearch"
          :search-results="searchResults"
          :tenant="tenant"
          @clear-search="handleClearSearch"
          @search="handleSearch"
          @select="handleAddUser"
        />

        <v-row class="mt-8">
          <v-col :cols="12" class="d-flex justify-start">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>

    <SimpleDialog
      v-model="showDeleteDialog"
      :buttons="deleteDialogButtons"
      :max-width="650"
      message="This will only take them out of this group - it won't remove them
        from the tenant. Removing membership from a group is permanent and
        cannot be undone. Please confirm before proceeding."
      title="You're about to permanently remove this user from this group"
      @button-click="handleDeleteDialogAction"
    />
  </v-container>
</template>
