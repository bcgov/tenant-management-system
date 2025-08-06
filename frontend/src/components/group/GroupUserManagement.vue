<script setup lang="ts">
import { computed, ref } from 'vue'

import UserSearch from '@/components/group/UserSearch.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import type { Group, GroupUser, Tenant, User } from '@/models'
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

function handleDeleteClick(groupUser: GroupUser) {
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
      <v-col cols="12">
        <h4 class="mb-6 mt-12">Group Members</h4>
        <v-data-table
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
          :headers="[
            {
              title: 'First Name',
              key: 'user.ssoUser.firstName',
              align: 'start',
            },
            {
              title: 'Last Name',
              key: 'user.ssoUser.lastName',
              align: 'start',
            },
            { title: 'Email', key: 'user.ssoUser.email', align: 'start' },
            {
              title: 'Actions',
              key: 'actions',
              align: 'center',
              sortable: false,
            },
          ]"
          :items="group.groupUsers"
          :sort-by="[{ key: 'user.ssoUser.firstName' }]"
          item-value="id"
          striped="even"
          fixed-header
          hover
        >
          <template #[`item.actions`]="{ item }">
            <v-btn
              v-if="isUserAdmin"
              icon="mdi-delete-outline"
              size="x-large"
              variant="text"
              @click="handleDeleteClick(item)"
            />
          </template>

          <template #no-data>
            <v-alert type="info">You have no users in this group</v-alert>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-row v-if="isUserAdmin && !showSearch" class="mt-4">
      <v-col class="d-flex justify-start" cols="12">
        <FloatingActionButton
          icon="mdi-plus-box"
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
          @clear-search="handleClearSearch"
          @search="handleSearch"
          @select="handleAddUser"
        />

        <v-row class="mt-8">
          <v-col class="d-flex justify-start" cols="12">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>

    <SimpleDialog
      v-model="showDeleteDialog"
      :buttons="deleteDialogButtons"
      message="This will only take them out of this group - it won't remove them
        from the tenant. Removing membership from a group is permanent and
        cannot be undone. Please confirm before proceeding."
      title="You're about to permanently remove this user from this group"
      @button-click="handleDeleteDialogAction"
    />
  </v-container>
</template>
