<script setup lang="ts">
import { mdiPlus } from '@mdi/js'
import { ref, watch } from 'vue'

import TenantUserTable from '@/components/tenant/TenantUserTable.vue'
import UserSearch from '@/components/tenant/UserSearch.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { type Group } from '@/models/group.model'
import { type Role, type RoleId } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { type User, type UserId } from '@/models/user.model'
import { type IdirSearchType } from '@/utils/constants'
import { isIdpIdir } from '@/utils/identityProvider'

// --- Component Interface -----------------------------------------------------

const { allGroups, allRoles, loadingSearch, searchResults, tenant } =
  defineProps<{
    allGroups: Group[]
    allRoles: Role[]
    isUserAdmin: boolean
    loadingSearch: boolean
    searchResults: User[] | null
    tenant: Tenant
  }>()

const emit = defineEmits<{
  add: [User, Group[]]
  cancel: []
  'clear-search': []
  'remove-role': [UserId, RoleId]
  'remove-user': [UserId]
  'roles-changed': [User, RoleId[], RoleId[]]
  search: [IdirSearchType, string]
}>()

// --- Component State ---------------------------------------------------------

const addGroups = ref<boolean[]>([])

const selectAllGroups = ref(false)
const selectAllRoles = ref(false)
const selectedRoles = ref<Role[]>([])
const selectedUser = ref<User | null>(null)
const showSearch = ref(false)

// --- Watchers and Effects ----------------------------------------------------

watch(selectAllGroups, () => {
  addGroups.value = []
  for (const _ of allGroups) {
    addGroups.value.push(selectAllGroups.value)
  }
})

watch(selectAllRoles, () => {
  selectedRoles.value = []
  for (const role of allRoles) {
    if (selectAllRoles.value) {
      selectedRoles.value.push(role)
    }
  }
})

// --- Component Methods -------------------------------------------------------

const handleAddUser = (user: User, rolesToAdd: Role[]) => {
  user.roles = [...rolesToAdd]
  const selectedGroups = allGroups.filter((_, i) => addGroups.value[i])

  emit('add', user, selectedGroups)
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

const handleRolesChanged = (
  user: User,
  rolesToAdd: RoleId[],
  rolesToRemove: RoleId[],
) => {
  emit('roles-changed', user, rolesToAdd, rolesToRemove)
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
  <h1>Tenant users</h1>

  <TenantUserTable
    :is-user-admin="isUserAdmin"
    :roles="allRoles"
    :users="tenant.users"
    @remove-role="handleRemoveRole"
    @remove-user="handleRemoveUser"
    @roles-changed="handleRolesChanged"
  />

  <v-row v-if="isUserAdmin && !showSearch">
    <v-col class="d-flex justify-start mt-12" cols="12">
      <ButtonPrimary
        :prepend-icon="mdiPlus"
        text="Add user to tenant"
        @click="toggleSearch"
      />
    </v-col>
  </v-row>

  <v-expand-transition>
    <div v-if="showSearch">
      <v-divider class="my-12" />

      <h4 class="mb-4">Add a user to this tenant</h4>

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
          <p class="mb-2 text-body-medium">Available roles:</p>
        </v-col>
        <v-col cols="12">
          <v-checkbox
            v-model="selectAllRoles"
            class="d-sm-inline-block"
            label="Select all"
          />
          <div
            v-for="(role, index) in allRoles"
            :key="`role-${index}`"
            class="d-sm-inline-block"
          >
            <v-checkbox
              v-if="isIdpIdir(selectedUser.ssoUser.idpType) || index === 0"
              v-model="selectedRoles"
              :label="role.description"
              :value="role"
              class="d-sm-inline-block"
            />
          </div>
        </v-col>
      </v-row>

      <v-row v-if="selectedUser && allGroups.length > 0" class="mt-4">
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
            v-for="(group, index) in allGroups"
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
            text="Add user"
            @click="handleAddUser(selectedUser, selectedRoles)"
          />
        </v-col>
      </v-row>
    </div>
  </v-expand-transition>

  <v-divider class="my-12" />
</template>
