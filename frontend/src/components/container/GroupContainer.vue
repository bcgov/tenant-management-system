<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

import GroupCreateDialog from '@/components/group/GroupCreateDialog.vue'
import GroupList from '@/components/group/GroupList.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { type GroupDetailFields, Tenant } from '@/models'
import { useGroupStore } from '@/stores'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

const props = defineProps<{
  tenant: Tenant
}>()

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

const groupStore = useGroupStore()

const { notification } = useNotification()

// Component Data

const isDuplicateName = ref(false)

// Component State

const isLoading = ref(true)
const { groups } = storeToRefs(groupStore)

const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

// Component Lifecycle

onMounted(async () => {
  try {
    // Fetch the tenant that is being managed.
    await groupStore.fetchGroups(props.tenant.id)
  } catch {
    notification.error('Failed to load tenant groups')
  } finally {
    isLoading.value = false
  }
})

// Subcomponent Event Handlers

const handleGroupCreate = async (
  group: GroupDetailFields,
  addUser: boolean,
) => {
  try {
    await groupStore.addGroup(props.tenant.id, group.name, group.description)
    if (addUser) {
      console.log('todo')
    }

    notification.success('Group Created Successfully')
    isDuplicateName.value = false
    closeDialog()
  } catch (error: unknown) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      notification.error(error.userMessage)
    } else {
      // Otherwise display a generic error message.
      notification.error('Failed to create the new group')
    }
  }
}
</script>

<template>
  <h4 class="mb-6">Groups</h4>

  <ButtonPrimary
    v-if="isUserAdmin"
    class="mb-12"
    text="Create a Group"
    @click="openDialog"
  />

  <GroupList
    v-if="!isLoading && groups.length > 0"
    :groups="groupStore.groups"
    :is-admin="isUserAdmin"
  />
  <v-container v-else>
    <p class="text-center">
      No groups have been created for this tenant yet.
      <span v-if="isUserAdmin">Click Create a Group to get started.</span>
    </p>
    <p class="text-center"><a href="#">Learn more about Groups</a></p>
  </v-container>

  <GroupCreateDialog
    v-model="dialogVisible"
    :is-duplicate-name="isDuplicateName"
    @clear-duplicate-error="isDuplicateName = false"
    @submit="handleGroupCreate"
  />
</template>
