<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import UserSearch from '@/components/tenant/UserSearch.vue'
import RoleDialog from '@/components/tenant/RoleDialog.vue'
import type { Role, Tenant, User } from '@/models'
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
  (event: 'add', user: User): void
  (event: 'cancel' | 'clear-search'): void
  (event: 'remove-role', userId: string, roleId: string): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
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
const modifyingUser = ref<User | null>(null)

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

function toggleRole(role: Role, checked: boolean) {
  if (checked) {
    if (!selectedRoles.value.find((r) => r.id === role.id)) {
      selectedRoles.value.push(role)
    }
  } else {
    selectedRoles.value = selectedRoles.value.filter((r) => r.id !== role.id)
  }
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
  emit('add', selectedUser.value)
  toggleSearch()
}

function handleCancel() {
  emit('cancel')
  toggleSearch()
}

function handleClearSearch() {
  selectedUser.value = null
  selectedRoles.value = []
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

function handleRemoveRole(user: User, role: Role) {
  if (!props.tenant) {
    return
  }

  const isOwnerRole = role.name === ROLES.TENANT_OWNER.value
  const ownerCount = props.tenant.getOwners().length

  if (isOwnerRole && ownerCount <= 1) {
    showInfo(
      `There must be at least one user with the ${t('roles.owner')} role. To remove ` +
        'this role from the current user, assign the role to another user first.',
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

function handleUserSelected(user: User) {
  selectedUser.value = user
}

function showInfo(message: string) {
  infoDialog.value.message = message
  infoDialogVisible.value = true
}

function showRoleDialog(user: User) {
  modifyingUser.value = user
  roleDialogVisible.value = true
}

function handleCloseRoleDialog(open: boolean) {
  roleDialogVisible.value = open
  modifyingUser.value = null
}
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col cols="12">
        <h4 class="mb-6 mt-12">Tenant Users</h4>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="userSearch"
          append-inner-icon="mdi-magnify"
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
        <v-data-table
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
          :headers="[
            { title: 'Name', key: 'ssoUser.displayName', align: 'start' },
            {
              title: 'TMS Roles',
              key: 'roles',
              align: 'start',
              sortable: false,
            },
            { title: 'Email', key: 'ssoUser.email', align: 'start' },
          ]"
          :items="tenant.users"
          :search="userSearch"
          :sort-by="[{ key: 'ssoUser.displayName' }]"
          item-value="id"
          striped="even"
          fixed-header
          hover
        >
          <template #no-data>
            <v-alert type="info">{{
              userSearch
                ? 'No users match your search criteria'
                : 'You have no users in this tenant'
            }}</v-alert>
          </template>
          <template #[`item.roles`]="{ item }">
            <div class="d-flex flex-wrap" style="gap: 8px; margin-block: 4px">
              <v-btn
                class="default-radius"
                icon="mdi-plus"
                size="x-small"
                @click="showRoleDialog(item)"
              />
              <v-chip
                v-for="role in item.roles"
                :key="role.id"
                class="d-inline-flex align-center"
                color="primary"
              >
                {{ role.description }}
                <v-icon
                  v-if="isUserAdmin"
                  class="ml-1 cursor-pointer"
                  icon="mdi-close"
                  size="small"
                  @click.stop="handleRemoveRole(item, role)"
                />
              </v-chip>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-row v-if="isUserAdmin && !showSearch" class="mt-4">
      <v-col class="d-flex justify-start" cols="12">
        <FloatingActionButton
          icon="mdi-plus-box"
          text="Add User to Tenant"
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
          :loading="loadingSearch"
          :search-results="searchResults"
          @clear-search="handleClearSearch"
          @search="handleSearch"
          @select="handleUserSelected"
        />

        <v-row v-if="selectedUser" class="mt-4">
          <v-col cols="12">
            <p class="mb-2">2. Assign role(s) to this user:</p>

            <v-checkbox
              v-for="role in roles"
              :key="role.id"
              :label="role.description"
              :model-value="selectedRoles.some((r) => r.id === role.id)"
              class="my-0 py-0"
              hide-details
              @update:model-value="
                (checked: boolean | null) => toggleRole(role, !!checked)
              "
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

    <RoleDialog
      v-model="roleDialogVisible"
      :tenant="tenant"
      :user="modifyingUser"
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
