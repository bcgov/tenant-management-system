<script setup lang="ts">
import {
  mdiClose,
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiMagnify,
  mdiPencil,
} from '@mdi/js'
import { computed, ref } from 'vue'

import RoleDialog from '@/components/tenant/RoleDialog.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import { type Role } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'
import { identityProviderToDisplay } from '@/utils/identityProvider'
import { currentUserHasRole } from '@/utils/permissions'

// --- Types & Interfaces ------------------------------------------------------

type TableHeaderItem = {
  align?: 'center' | 'end' | 'start'
  key: string
  sortable?: boolean
  title: string
}

// --- Component Interface -----------------------------------------------------

const { tenant, users } = defineProps<{
  tenant: Tenant
  users: User[]
}>()

const emit = defineEmits<{
  'add-user': [User]
  'remove-role': [User, Role]
  'remove-user': [User]
}>()

// --- Component State ---------------------------------------------------------

const editRolesDialogVisible = ref(false)

const modifyingUserIndex = ref<number | null>(null)

const removeRoleDialog = ref({
  buttons: [
    { action: 'cancel', text: 'Cancel', type: 'secondary' as const },
    { action: 'remove', text: 'Remove', type: 'primary' as const },
  ],
  message: 'Are you sure you want to remove this role from the user?',
  title: 'Confirm Role Removal',
  visible: false,
})

const removeUserDialog = ref({
  buttons: [
    { action: 'cancel', text: 'Cancel', type: 'secondary' as const },
    {
      action: 'remove',
      text: 'Offboard User',
      type: 'primary' as const,
    },
  ],
  message:
    "This action will remove this user's tenant and group memberships. They " +
    'will no longer have access to any systems using CSTAR.',
  title: 'Offboarding User',
  visible: false,
})

// The tenant user role that is selected for removal.
const selectedRole = ref<Role | null>(null)

// The tenant user who is selected for an action like removal.
const selectedUser = ref<User | null>(null)

const userFilter = ref('')

// --- Computed Values ---------------------------------------------------------

const headers = computed(() => {
  const tableHeaderItems: TableHeaderItem[] = [
    {
      align: 'start',
      key: 'ssoUser.firstName',
      sortable: true,
      title: 'First Name',
    },
    {
      align: 'start',
      key: 'ssoUser.lastName',
      sortable: true,
      title: 'Last Name',
    },
    {
      align: 'start',
      key: 'ssoUser.email',
      sortable: true,
      title: 'Email',
    },
    {
      align: 'start',
      key: 'ssoUser.idpType',
      sortable: false,
      title: 'Identity Provider',
    },
    {
      align: 'start',
      key: 'roles',
      sortable: false,
      title: 'Tenant Roles',
    },
  ]

  if (isUserAdmin.value) {
    tableHeaderItems.push({
      align: 'center',
      key: 'actions',
      sortable: false,
      title: 'Actions',
    })
  }

  return tableHeaderItems
})

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(tenant, ROLES.USER_ADMIN.value)
  )
})

const moreThanOneTenantOwner = computed(() => {
  return tenant.getOwners().length > 1
})

// --- Component Methods -------------------------------------------------------

const canRemoveRole = (item: User, role: Role): boolean => {
  if (item.roles.length <= 1) {
    return false
  }

  if (!isUserAdmin.value) {
    return false
  }

  if (role.name !== ROLES.TENANT_OWNER.value) {
    return true
  }

  // For tenant owners, only allow role removal if there is more than one tenant
  // owner
  return moreThanOneTenantOwner.value
}

const canRemoveUser = (user: User): boolean => {
  return (
    moreThanOneTenantOwner.value ||
    !user.roles.some((r: Role) => r.name === ROLES.TENANT_OWNER.value)
  )
}

const handleEditRolesDialog = (open: boolean) => {
  editRolesDialogVisible.value = open
  modifyingUserIndex.value = null
}

const handleRemoveRoleButtonClick = (action: string) => {
  // When the action is "remove" the selectedRole.value and selectedUser.value
  // should never be null, but the guard simplifies the event signature.
  if (action === 'remove' && selectedRole.value && selectedUser.value) {
    emit('remove-role', selectedUser.value, selectedRole.value)
  }

  // Clear the selected role and user for both "Remove" and "Cancel" choices.
  selectedRole.value = null
  selectedUser.value = null
}

const handleRemoveUserButtonClick = (action: string) => {
  // When the action is "remove" the selectedUser.value should never be null,
  // but the guard simplifies the event signature.
  if (action === 'remove' && selectedUser.value) {
    emit('remove-user', selectedUser.value)
  }

  // Clear the selected user for both "Offboard User" and "Cancel" choices.
  selectedUser.value = null
}

const showEditRolesDialog = (user: User) => {
  const uIndex = tenant.users.findIndex((u: User) => {
    return u.id === user.id
  })

  modifyingUserIndex.value = uIndex
  editRolesDialogVisible.value = true
}

const showRemoveRoleDialog = (user: User, role: Role) => {
  selectedRole.value = role
  selectedUser.value = user
  removeRoleDialog.value.visible = true
}

const showRemoveUserDialog = (user: User) => {
  selectedUser.value = user
  removeUserDialog.value.visible = true
}
</script>

<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="4">
      <v-text-field
        v-model="userFilter"
        :append-inner-icon="mdiMagnify"
        label="Search"
        variant="outlined"
        clearable
        hide-details
        single-line
      ></v-text-field>
    </v-col>
  </v-row>

  <v-data-table
    :header-props="{ class: 'bg-surface-light font-weight-bold' }"
    :headers="headers"
    :items="users"
    :search="userFilter"
    :sort-by="[{ key: 'ssoUser.firstName' }]"
    item-value="id"
    striped="even"
  >
    <template #no-data>
      <div class="my-8">
        <p class="mt-0">No users match your search criteria</p>
      </div>
    </template>

    <template #[`item.roles`]="{ item }">
      <div class="d-flex flex-wrap" style="gap: 8px; margin-block: 4px">
        <v-chip
          v-for="role in [...item.roles].sort((a, b) =>
            a.description.localeCompare(b.description),
          )"
          :key="role.id"
          class="d-inline-flex align-center"
          color="primary"
        >
          {{ role.description }}
          <v-icon
            v-if="canRemoveRole(item, role)"
            :aria-label="`Remove Role ${role.description}`"
            :icon="mdiClose"
            class="ml-1 cursor-pointer"
            size="small"
            @click.stop="showRemoveRoleDialog(item, role)"
          />
        </v-chip>
      </div>
    </template>

    <template #[`item.ssoUser.idpType`]="{ item }">
      {{ identityProviderToDisplay(item.ssoUser.idpType) }}
    </template>

    <template #[`item.actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: activatorProps }">
          <v-btn
            :aria-label="`Open Menu for ${item.ssoUser.firstName} ${item.ssoUser.lastName}`"
            :icon="mdiDotsVertical"
            variant="text"
            v-bind="activatorProps"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            :aria-label="`Edit Tenant Roles for ${item.ssoUser.firstName} ${item.ssoUser.lastName}`"
            @click="showEditRolesDialog(item)"
          >
            <v-list-item-title>
              <v-icon :icon="mdiPencil" />
              Edit Tenant Roles
            </v-list-item-title>
          </v-list-item>

          <v-tooltip
            :disabled="canRemoveUser(item)"
            location="top"
            text="You can't offboard the last tenant owner"
          >
            <template #activator="{ props: tooltipProps }">
              <span v-bind="tooltipProps">
                <v-list-item
                  :aria-label="`Offboard User ${item.ssoUser.firstName} ${item.ssoUser.lastName}`"
                  :disabled="!canRemoveUser(item)"
                  @click="showRemoveUserDialog(item)"
                >
                  <v-list-item-title>
                    <v-icon :icon="mdiDeleteOutline" />
                    Offboard User
                  </v-list-item-title>
                </v-list-item>
              </span>
            </template>
          </v-tooltip>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>

  <RoleDialog
    v-model="editRolesDialogVisible"
    :tenant="tenant"
    :user-index="modifyingUserIndex"
    @update:open-dialog="handleEditRolesDialog"
  />

  <SimpleDialog
    v-model="removeRoleDialog.visible"
    :buttons="removeRoleDialog.buttons"
    :message="removeRoleDialog.message"
    :title="removeRoleDialog.title"
    @button-click="handleRemoveRoleButtonClick"
  />

  <SimpleDialog
    v-model="removeUserDialog.visible"
    :buttons="removeUserDialog.buttons"
    :message="removeUserDialog.message"
    :title="removeUserDialog.title"
    @button-click="handleRemoveUserButtonClick"
  />
</template>
