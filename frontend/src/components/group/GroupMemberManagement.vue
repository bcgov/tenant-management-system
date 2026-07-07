<script setup lang="ts">
import { mdiPlusBox } from '@mdi/js'
import { computed, ref } from 'vue'

import GroupMemberTable from '@/components/group/GroupMemberTable.vue'
import UserSearch from '@/components/group/UserSearch.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { type Group } from '@/models/group.model'
import { GroupUser, type GroupUserId } from '@/models/groupuser.model'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { type IdirSearchType, ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const { group, loadingSearch, searchResults, tenant } = defineProps<{
  group: Group
  loadingSearch: boolean
  searchResults: User[] | null
  tenant: Tenant
}>()

const emit = defineEmits<{
  add: [User]
  cancel: []
  'clear-search': []
  delete: [GroupUserId]
  search: [IdirSearchType, string]
}>()

// --- Component State ---------------------------------------------------------

const selectedMember = ref<User | null>(null)

const showSearch = ref(false)

// --- Computed Values ---------------------------------------------------------

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(tenant, ROLES.USER_ADMIN.value)
  )
})

// --- Component Methods -------------------------------------------------------

const handleAddMember = () => {
  // Guard clause - this should never happen because the add button is disabled
  // until a member is selected.
  if (!selectedMember.value) {
    return
  }

  emit('add', selectedMember.value)
  toggleSearch()
}

const handleCancel = () => {
  emit('cancel')
  toggleSearch()
}

const handleClearSearch = () => {
  emit('clear-search')
}

const handleMemberSelected = (user: User | null) => {
  selectedMember.value = user
}

const handleRemoveMember = (groupUser: GroupUser) => {
  emit('delete', groupUser.id)
}

const handleSearch = (searchType: IdirSearchType, searchText: string) => {
  emit('search', searchType, searchText)
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
        <GroupMemberTable
          :group-members="group.groupUsers"
          :tenant="tenant"
          @add-member="toggleSearch"
          @remove-member="handleRemoveMember"
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
          text="Add Member to Group"
          @click="toggleSearch"
        />
      </v-col>
    </v-row>

    <v-expand-transition>
      <div v-if="showSearch">
        <v-divider class="my-12" />

        <h4 class="mb-4">Add a member to this Group</h4>

        <p class="mb-2 mt-8">
          1. Search for a member based on the selection criteria below:
        </p>

        <UserSearch
          :loading="loadingSearch"
          :search-results="searchResults"
          :tenant="tenant"
          @clear-search="handleClearSearch"
          @search="handleSearch"
          @select="handleMemberSelected"
        />

        <v-row class="mt-8">
          <v-col :cols="12" class="d-flex justify-start">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />

            <ButtonPrimary
              :disabled="!selectedMember"
              text="Add Member"
              @click="handleAddMember"
            />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>
