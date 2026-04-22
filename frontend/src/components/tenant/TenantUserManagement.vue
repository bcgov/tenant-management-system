<script setup lang="ts">
import { mdiMagnify, mdiPlusBox } from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import RoleDialog from '@/components/tenant/RoleDialog.vue'
import UserSearch from '@/components/tenant/UserSearch.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import UserTable from '@/components/user/UserTable.vue'
import type { Group } from '@/models/group.model'
import type { Role } from '@/models/role.model'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { type IdirSearchType, ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Stores ------------------------------------------------------------------

// TODO: non-container components should not directly use stores - they should
// emit events and let the parent container handle the store interactions.
// Refactor this component to follow that pattern.
const groupStore = useGroupStore()

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
  (event: 'remove-role', userId: string, roleId: string): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
  (event: 'remove-user', userId: string | undefined): void
}>()

// --- Component State ---------------------------------------------------------

const confirmDialog = ref({
  title: 'Confirm Role Removal',
  message: 'Are you sure you want to remove this role from the user?',
  buttons: [
    { text: 'Cancel', action: 'cancel', type: 'secondary' as const },
    { text: 'Remove', action: 'remove', type: 'primary' as const },
  ],
})
const confirmDialogVisible = ref(false)

const confirmOffboardDialogVisible = ref(false)
const confirmOffboardDialog = ref({
  title: t('users.offboardUserTitle'),
  message: t('users.offboardUserMessage'),
  buttons: [
    { text: t('general.cancel'), action: 'cancel', type: 'secondary' as const },
    {
      text: t('users.offboardUserAction'),
      action: 'remove',
      type: 'secondary' as const,
    },
  ],
})

const infoDialog = ref({
  title: 'Action Blocked',
  message: '',
  buttons: [{ text: 'OK', action: 'ok', type: 'primary' as const }],
})
const infoDialogVisible = ref(false)
const pendingRole = ref<Role | null>(null)
const pendingUser = ref<User | null>(null)
const selectedRoles = ref<Role[]>([])
const selectedUser = ref<User | null>(null)
const showSearch = ref(false)
const userSearch = ref('')
const roleDialogVisible = ref(false)
const modifyingUserIndex = ref<number | null>(null)
const selectAllGroups = ref(false)
const selectAllRoles = ref(false)
const addGroups = ref<boolean[]>([])

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

function confirmRemoveRole() {
  if (pendingUser.value && pendingRole.value) {
    emit('remove-role', pendingUser.value.id, pendingRole.value.id)
  }

  pendingUser.value = null
  pendingRole.value = null
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    selectedUser.value = null
    selectedRoles.value = []
  }
}

function handleAddUser() {
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

function handleCancel() {
  emit('cancel')
  selectAllGroups.value = false
  selectAllRoles.value = false
  toggleSearch()
}

function handleClearSearch() {
  selectedUser.value = null
  selectedRoles.value = []
  selectAllGroups.value = false
  selectAllRoles.value = false
  emit('clear-search')
}

function handleConfirmButtonClick(action: string) {
  if (action === 'cancel') {
    pendingUser.value = null
    pendingRole.value = null
  } else if (action === 'remove') {
    confirmRemoveRole()
  }
}

function handleOffboardButtonClick(action: string) {
  if (action === 'cancel') {
    pendingUser.value = null
  } else if (action === 'remove') {
    emit('remove-user', pendingUser.value?.id)
    pendingUser.value = null
  }
}

function handleRemoveRole(user: User, role: Role) {
  if (!props.tenant) {
    return
  }

  const isOwnerRole = role.name === ROLES.TENANT_OWNER.value
  const ownerCount = props.tenant.getOwners().length

  if (isOwnerRole && ownerCount <= 1) {
    showInfo(
      `There must be at least one user with the ${t('roles.owner')} role. To ` +
        'remove this role from the current user, assign the role to another ' +
        'user first.',
    )
    return
  }

  if (user.roles.length <= 1) {
    showInfo(
      'The user cannot be removed from their only role. Each user must have ' +
        'at least one role to remain in a tenant. To proceed, assign a new ' +
        'role to this user before removing the current one.',
    )
    return
  }

  pendingUser.value = user
  pendingRole.value = role
  confirmDialogVisible.value = true
}

function handleSearch(searchType: IdirSearchType, searchText: string) {
  emit('search', searchType, searchText)
}

function handleUserSelected(user: User | null) {
  selectedUser.value = user
}

function showInfo(message: string) {
  infoDialog.value.message = message
  infoDialogVisible.value = true
}

function showOffboardDialog(user: User) {
  pendingUser.value = user
  confirmOffboardDialog.value.message = t('users.offboardUserMessage')
  confirmOffboardDialogVisible.value = true
}

function handleCloseRoleDialog(open: boolean) {
  roleDialogVisible.value = open
  modifyingUserIndex.value = null
}

function showChangeRoles(user: User) {
  const uIndex = props.tenant.users.findIndex((u: User) => {
    return u.id === user.id
  })

  if (uIndex !== -1) {
    modifyingUserIndex.value = uIndex
    roleDialogVisible.value = true
  }
}

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
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col cols="12">
        <h4 class="mb-6 mt-12">
          {{ $t('tenants.tenant', { count: 1 }) }}
          {{ $t('users.user', { count: 2 }) }}
        </h4>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="userSearch"
          :append-inner-icon="mdiMagnify"
          label="Search"
          variant="outlined"
          clearable
          hide-details
          single-line
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <UserTable
          :edit-user-roles="showChangeRoles"
          :filter="userSearch"
          :handle-remove-role="handleRemoveRole"
          :show-actions="isUserAdmin"
          :show-edit-roles="true"
          :show-offboard-dialog="showOffboardDialog"
          :show-roles="true"
          :tenant="tenant"
          :users="tenant.users"
          where="tenant"
          @add-first-clicked="showSearch = true"
        />
      </v-col>
    </v-row>

    <v-row
      v-if="isUserAdmin && !showSearch && tenant.users.length !== 0"
      class="mt-4"
    >
      <v-col class="d-flex justify-start" cols="12">
        <FloatingActionButton
          :icon="mdiPlusBox"
          :text="$t('tenants.addAnotherUser', tenant.users.length)"
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

    <!-- Info dialog for single-button notifications -->
    <SimpleDialog
      v-model="infoDialogVisible"
      :buttons="infoDialog.buttons"
      :message="infoDialog.message"
      :title="infoDialog.title"
    />

    <!-- Confirmation dialog for yes/no decisions -->
    <SimpleDialog
      v-model="confirmDialogVisible"
      :buttons="confirmDialog.buttons"
      :message="confirmDialog.message"
      :title="confirmDialog.title"
      @button-click="handleConfirmButtonClick"
    />

    <!-- Confirm offboard user dialog -->
    <SimpleDialog
      v-model="confirmOffboardDialogVisible"
      :buttons="confirmOffboardDialog.buttons"
      :message="confirmOffboardDialog.message"
      :title="confirmOffboardDialog.title"
      dialog-type="warning"
      @button-click="handleOffboardButtonClick"
    />

    <RoleDialog
      v-if="isUserAdmin"
      v-model="roleDialogVisible"
      :tenant="tenant"
      :user-index="modifyingUserIndex"
      @update:open-dialog="handleCloseRoleDialog"
    />

    <v-divider class="my-12" />

    <GroupListContainer :tenant="tenant" />
  </v-container>
</template>

<style scoped>
.v-btn--icon.default-radius {
  border-radius: 4px;
}
</style>
