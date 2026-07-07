<script setup lang="ts">
import { mdiDeleteOutline, mdiDotsVertical } from '@mdi/js'
import { computed, ref } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import SimpleDialog, {
  type DialogButton,
} from '@/components/ui/SimpleDialog.vue'
import { type GroupUser } from '@/models/groupuser.model'
import { type Tenant } from '@/models/tenant.model'
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

const { groupMembers, tenant } = defineProps<{
  groupMembers: GroupUser[]
  tenant: Tenant
}>()

const emit = defineEmits<{
  'add-member': []
  'remove-member': [groupUser: GroupUser]
}>()

// --- Component State ---------------------------------------------------------

const groupUserToRemove = ref<GroupUser | null>(null)

const showRemoveDialog = ref(false)

// --- Computed Values ---------------------------------------------------------

const headers = computed(() => {
  const tableHeaderItems: TableHeaderItem[] = [
    {
      align: 'start',
      key: 'user.ssoUser.firstName',
      sortable: true,
      title: 'First Name',
    },
    {
      align: 'start',
      key: 'user.ssoUser.lastName',
      sortable: true,
      title: 'Last Name',
    },
    {
      align: 'start',
      key: 'user.ssoUser.email',
      sortable: true,
      title: 'Email',
    },
    {
      align: 'start',
      key: 'user.ssoUser.idpType',
      sortable: false,
      title: 'Identity Provider',
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

const removeDialogButtons = computed<DialogButton[]>(() => [
  {
    action: 'cancel',
    text: 'Cancel',
    type: 'secondary',
  },
  {
    action: 'remove',
    text: 'Remove Member',
    type: 'primary',
  },
])

// --- Component Methods -------------------------------------------------------

const handleRemoveDialogAction = (action: string) => {
  if (action === 'remove' && groupUserToRemove.value) {
    emit('remove-member', groupUserToRemove.value)
  }

  groupUserToRemove.value = null
  showRemoveDialog.value = false
}

const handleRemoveMemberButton = (groupUser: GroupUser) => {
  groupUserToRemove.value = groupUser
  showRemoveDialog.value = true
}
</script>

<template>
  <v-data-table
    :header-props="{
      class: 'bg-surface-light font-weight-bold',
    }"
    :headers="headers"
    :hide-default-footer="groupMembers.length === 0"
    :items="groupMembers"
    :sort-by="[{ key: 'user.ssoUser.firstName' }]"
    item-value="id"
    striped="even"
  >
    <template #no-data>
      <div class="my-8">
        <h5 class="mb-2">No group members added yet</h5>

        <p class="mt-0">Add your first group member to get started.</p>

        <ButtonPrimary
          v-if="isUserAdmin"
          class="mt-4"
          text="Add group member"
          @click="emit('add-member')"
        />
      </div>
    </template>

    <template #[`item.user.ssoUser.idpType`]="{ item }">
      {{ identityProviderToDisplay(item.user.ssoUser.idpType) }}
    </template>

    <template #[`item.actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: activatorProps }">
          <v-btn
            :aria-label="`Open Menu for ${item.user.ssoUser.firstName} ${item.user.ssoUser.lastName}`"
            :icon="mdiDotsVertical"
            variant="text"
            v-bind="activatorProps"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-if="isUserAdmin"
            @click="handleRemoveMemberButton(item)"
          >
            <v-list-item-title>
              <v-icon :icon="mdiDeleteOutline" aria-label="Remove Member" />
              Remove Member
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>

  <SimpleDialog
    v-model="showRemoveDialog"
    :buttons="removeDialogButtons"
    :max-width="650"
    dialog-type="warning"
    message="This will remove the member from this group only. This action can't
      be undone."
    title="Remove member from group?"
    @button-click="handleRemoveDialogAction"
  />
</template>
