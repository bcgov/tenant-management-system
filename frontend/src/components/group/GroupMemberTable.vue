<script setup lang="ts">
import {
  mdiClose,
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiMagnify,
} from '@mdi/js'
import { computed, ref } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import SimpleDialog, {
  type DialogButton,
} from '@/components/ui/SimpleDialog.vue'
import { type GroupUser } from '@/models/groupuser.model'
import { identityProviderToDisplay } from '@/utils/identityProvider'

// --- Types & Interfaces ------------------------------------------------------

type TableHeaderItem = {
  align?: 'center' | 'end' | 'start'
  key: string
  sortable?: boolean
  title: string
}

// --- Component Interface -----------------------------------------------------

const { isUserAdmin, groupMembers } = defineProps<{
  isUserAdmin: boolean
  groupMembers: GroupUser[]
}>()

const emit = defineEmits<{
  'add-member': []
  'remove-member': [GroupUser]
}>()

// --- Component State ---------------------------------------------------------

const groupMemberToRemove = ref<GroupUser | null>(null)

const memberFilter = ref('')

const memberFilterField = ref<{ focus: () => void } | null>(null)

const showRemoveDialog = ref(false)

// --- Computed Values ---------------------------------------------------------

const headers = computed(() => {
  const tableHeaderItems: TableHeaderItem[] = [
    {
      align: 'start',
      key: 'user.ssoUser.firstName',
      sortable: true,
      title: 'First name',
    },
    {
      align: 'start',
      key: 'user.ssoUser.lastName',
      sortable: true,
      title: 'Last name',
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
      title: 'Identity provider',
    },
  ]

  if (isUserAdmin) {
    tableHeaderItems.push({
      align: 'center',
      key: 'actions',
      sortable: false,
      title: 'Actions',
    })
  }

  return tableHeaderItems
})

const removeDialogButtons = computed<DialogButton[]>(() => [
  {
    action: 'cancel',
    text: 'Cancel',
    type: 'secondary',
  },
  {
    action: 'remove',
    text: 'Remove member',
    type: 'primary',
  },
])

// --- Component Methods -------------------------------------------------------

const handleMemberFilterClear = () => {
  memberFilter.value = ''
  memberFilterField.value?.focus()
}

const handleRemoveDialogAction = (action: string) => {
  if (action === 'remove' && groupMemberToRemove.value) {
    emit('remove-member', groupMemberToRemove.value)
  }

  groupMemberToRemove.value = null
  showRemoveDialog.value = false
}

const handleRemoveMemberButton = (groupMember: GroupUser) => {
  groupMemberToRemove.value = groupMember
  showRemoveDialog.value = true
}
</script>

<template>
  <v-row v-if="groupMembers.length > 0" class="mb-6">
    <v-col cols="12" sm="4">
      <v-text-field
        ref="memberFilterField"
        v-model="memberFilter"
        :append-inner-icon="mdiMagnify"
        label="Search"
        variant="outlined"
        clearable
        hide-details
        single-line
      >
        <template #clear>
          <v-btn
            :icon="mdiClose"
            aria-label="Clear search"
            density="comfortable"
            size="small"
            variant="text"
            @click="handleMemberFilterClear"
          />
        </template>
      </v-text-field>
    </v-col>
  </v-row>

  <v-data-table
    :header-props="{ class: 'bg-surface-light font-weight-bold' }"
    :headers="headers"
    :hide-default-footer="groupMembers.length === 0"
    :items="groupMembers"
    :search="memberFilter"
    :sort-by="[{ key: 'user.ssoUser.firstName' }]"
    item-value="id"
    striped="even"
  >
    <template #no-data>
      <div v-if="memberFilter" class="my-8">
        <p class="mt-0">No members match your search criteria</p>
      </div>
      <div v-else class="my-8">
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
            :aria-label="`Open menu for ${item.user.getName()}`"
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
              <v-icon :icon="mdiDeleteOutline" aria-label="Remove member" />
              Remove member
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
    message="This will remove the member from this group only. This action can't
      be undone."
    title="Confirm remove member"
    @button-click="handleRemoveDialogAction"
  />
</template>
