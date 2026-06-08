<script setup lang="ts">
import { mdiPlusBox } from '@mdi/js'
import { computed, ref } from 'vue'

import UserSearch from '@/components/group/UserSearch.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import UserTable from '@/components/user/UserTable.vue'
import { type Group } from '@/models/group.model'
import { GroupUser, type GroupUserId } from '@/models/groupuser.model'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { type IdirSearchType, ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

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
  (event: 'delete', userId: GroupUserId): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
}>()

// --- Component State ---------------------------------------------------------

const groupUserToDelete = ref<GroupUser | null>(null)
const selectedUser = ref<User | null>(null)
const showDeleteDialog = ref(false)
const showSearch = ref(false)

// --- Computed Values ---------------------------------------------------------

const deleteDialogButtons = computed(() => [
  {
    action: 'cancel',
    text: 'Cancel',
    type: 'secondary' as const,
  },
  {
    action: 'remove',
    text: 'Remove',
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

const handleAddUser = () => {
  if (!selectedUser.value) {
    return
  }

  emit('add', selectedUser.value)
  toggleSearch()
}

const handleCancel = () => {
  emit('cancel')
  toggleSearch()
}

const handleClearSearch = () => {
  emit('clear-search')
}

const handleDeleteClick = (user: User) => {
  // TODO
  const groupUser = new GroupUser(user.id as unknown as GroupUserId, user)

  showDeleteDialog.value = true
  groupUserToDelete.value = groupUser
}

const handleDeleteDialogAction = (action: string) => {
  if (action === 'remove' && groupUserToDelete.value) {
    emit('delete', groupUserToDelete.value.id)
  }

  showDeleteDialog.value = false
  groupUserToDelete.value = null
}

const handleSearch = (searchType: IdirSearchType, searchText: string) => {
  emit('search', searchType, searchText)
}

const handleUserSelected = (user: User | null) => {
  selectedUser.value = user
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
}
</script>

<template>
  <v-container class="ms-6">
    <v-row>
      <v-col :cols="12">
        <h4>Group Members</h4>
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
          @select="handleUserSelected"
        />

        <v-row class="mt-8">
          <v-col :cols="12" class="d-flex justify-start">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />

            <ButtonPrimary
              :disabled="!selectedUser"
              text="Add User"
              @click="handleAddUser"
            />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>

    <SimpleDialog
      v-model="showDeleteDialog"
      :buttons="deleteDialogButtons"
      :max-width="650"
      dialog-type="warning"
      message="This will remove the user from this group only. This action can't
        be undone."
      title="Remove user from group?"
      @button-click="handleDeleteDialogAction"
    />
  </v-container>
</template>
