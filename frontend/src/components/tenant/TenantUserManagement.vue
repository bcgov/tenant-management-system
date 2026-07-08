<script setup lang="ts">
import { mdiPlusBox } from '@mdi/js'
import { computed, ref, watch } from 'vue'

import TenantUserTable from '@/components/tenant/TenantUserTable.vue'
import UserSearch from '@/components/tenant/UserSearch.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import { type Group } from '@/models/group.model'
import { type Role, type RoleId } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { type User, type UserId } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { type IdirSearchType, ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  loadingSearch: boolean
  possibleRoles?: Role[]
  searchResults: User[] | null
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'add', user: User, groups: Group[]): void
  (event: 'cancel' | 'clear-search'): void
  (event: 'remove-role', userId: UserId, roleId: RoleId): void
  (event: 'remove-user', userId: UserId): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
}>()

// --- Store and Composable Setup ----------------------------------------------

// TODO: non-container components should not directly use stores - they should
// emit events and let the parent container handle the store interactions.
// Refactor this component to follow that pattern.
const groupStore = useGroupStore()

// --- Component State ---------------------------------------------------------

const addGroups = ref<boolean[]>([])

const selectAllGroups = ref(false)
const selectAllRoles = ref(false)
const selectedRoles = ref<Role[]>([])
const selectedUser = ref<User | null>(null)
const showSearch = ref(false)

// --- Watchers and Effects ----------------------------------------------------

watch(groupStore.groups, (newGroups) => {
  addGroups.value = []
  for (const _ of newGroups) {
    addGroups.value.push(selectAllGroups.value)
  }
})

watch(selectAllGroups, () => {
  addGroups.value = []
  for (const _ of groupStore.groups) {
    addGroups.value.push(selectAllGroups.value)
  }
})

watch(selectAllRoles, () => {
  selectedRoles.value = []
  for (const role of roles.value) {
    if (selectAllRoles.value) {
      selectedRoles.value.push(role)
    }
  }
})

// --- Computed Values ---------------------------------------------------------

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

const roles = computed(() => props.possibleRoles ?? [])

// --- Component Methods -------------------------------------------------------

const handleAddUser = () => {
  if (!selectedUser.value || selectedRoles.value.length === 0) {
    return
  }

  selectedUser.value.roles = [...selectedRoles.value]
  const selectedGroups: Group[] = []
  for (let i = 0; i < addGroups.value.length; i++) {
    if (addGroups.value[i]) {
      const group = groupStore.groups[i]
      selectedGroups.push(group)
    }
  }
  emit('add', selectedUser.value, selectedGroups)
  selectAllGroups.value = false
  selectAllRoles.value = false
  toggleSearch()
}

const handleCancel = () => {
  emit('cancel')
  selectAllGroups.value = false
  selectAllRoles.value = false
  toggleSearch()
}

const handleClearSearch = () => {
  selectedUser.value = null
  selectedRoles.value = []
  selectAllGroups.value = false
  selectAllRoles.value = false
  emit('clear-search')
}

const handleRemoveRole = (user: User, role: Role) => {
  emit('remove-role', user.id, role.id)
}

const handleRemoveUser = (user: User) => {
  emit('remove-user', user.id)
}

const handleSearch = (searchType: IdirSearchType, searchText: string) => {
  emit('search', searchType, searchText)
}

const handleUserSelected = (user: User | null) => {
  selectedUser.value = user
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    selectedUser.value = null
    selectedRoles.value = []
  }
}
</script>

<template>
  <v-container class="ms-6">
    <v-row>
      <v-col cols="12">
        <h4>Tenant Users</h4>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <TenantUserTable
          :tenant="tenant"
          :users="tenant.users"
          @remove-role="handleRemoveRole"
          @remove-user="handleRemoveUser"
        />
      </v-col>
    </v-row>

    <v-row v-if="isUserAdmin && !showSearch" class="mt-4">
      <v-col class="d-flex justify-start" cols="12">
        <FloatingActionButton
          :icon="mdiPlusBox"
          text="Add another user to this tenant"
          @click="toggleSearch"
        />
      </v-col>
    </v-row>

    <v-expand-transition>
      <div v-if="showSearch">
        <v-divider class="my-12" />

        <h4 class="mb-4">Add a user to this Tenant</h4>

        <p class="mb-2 mt-8">
          1. Search for a user based on the selection criteria below:
        </p>

        <UserSearch
          :current-users="tenant.users"
          :loading="loadingSearch"
          :search-results="searchResults"
          :tenant="tenant"
          @clear-search="handleClearSearch"
          @search="handleSearch"
          @select="handleUserSelected"
        />

        <v-row v-if="selectedUser" class="mt-4">
          <v-col cols="12">
            <p class="mb-2">2. Assign role(s) to this user:</p>
          </v-col>
          <v-col cols="6">
            <p class="mb-2 text-body-medium">Available Roles:</p>
          </v-col>
          <v-col cols="12">
            <v-checkbox
              v-model="selectAllRoles"
              class="d-sm-inline-block"
              label="Select all"
            />
            <div
              v-for="(role, index) in roles"
              :key="`role-${index}`"
              class="d-sm-inline-block"
            >
              <v-checkbox
                v-if="selectedUser?.ssoUser?.idpType === 'idir' || index === 0"
                v-model="selectedRoles"
                :label="role.description"
                :value="role"
                class="d-sm-inline-block"
              />
            </div>
          </v-col>
        </v-row>

        <v-row
          v-if="
            selectedUser &&
            groupStore.groups.length &&
            groupStore.groups.length > 0
          "
          class="mt-4"
        >
          <v-col cols="12">
            <p class="mb-2">3. Assign group(s) to this user:</p>
          </v-col>
          <v-col cols="12">
            <v-checkbox
              v-model="selectAllGroups"
              class="d-sm-inline-block"
              label="Select all"
            />
            <v-checkbox
              v-for="(group, index) in groupStore.groups"
              :key="group.id"
              v-model="addGroups[index]"
              :label="group.name"
              class="d-sm-inline-block"
            />
          </v-col>
        </v-row>

        <v-row class="mt-8">
          <v-col class="d-flex justify-start" cols="12">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />

            <ButtonPrimary
              v-if="selectedUser"
              :disabled="selectedRoles.length === 0"
              text="Add User"
              @click="handleAddUser"
            />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>

    <v-divider class="my-12" />
  </v-container>
</template>
