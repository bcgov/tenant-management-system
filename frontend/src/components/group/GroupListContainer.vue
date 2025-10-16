<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import GroupCreateDialog from '@/components/group/GroupCreateDialog.vue'
import GroupList from '@/components/group/GroupList.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError, ServerError } from '@/errors'
import { Group, type GroupDetailFields, Tenant } from '@/models'
import { useAuthStore, useGroupStore } from '@/stores'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const groupStore = useGroupStore()
const notification = useNotification()
const router = useRouter()

// --- Component State ---------------------------------------------------------

const dialogVisible = ref(false)
const isDuplicateName = ref(false)

// --- Computed Values ---------------------------------------------------------

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

// --- Component Methods -------------------------------------------------------

const dialogClose = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

const dialogOpen = () => (dialogVisible.value = true)

const handleCardClick = (id: Group['id']) => {
  router.push(`/tenants/${props.tenant.id}/groups/${id}`)
}

const handleGroupCreate = async (
  groupDetails: GroupDetailFields,
  addUser: boolean,
) => {
  let group: Group

  try {
    console.log(groupDetails, 'group details')
    group = await groupStore.addGroup(
      props.tenant.id,
      groupDetails.name,
      groupDetails.description,
    )
    console.log('3')

    isDuplicateName.value = false
    notification.success('Group Created Successfully')
    dialogClose()
  } catch (error: unknown) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message that comes
      // from the API. This should not happen but is useful if there are
      // business rules in the API that are not implemented in the UI.
      console.log('domain error', error)
      notification.error(error.userMessage)
    } else if (error instanceof ServerError) {
      console.log('server error', error)
      notification.error(error.userMessage)
    } else {
      // Otherwise display a generic error message.
      notification.error('Failed to create the new group')
    }

    return
  }

  // It would be nice if two try/catch blocks weren't needed, but it's good to
  // give clear feedback if adding the user fails. Since the group creation
  // cannot be rolled back, failing to add the user means that the group has no
  // users, but the user add can be attempted later.
  if (addUser) {
    try {
      await groupStore.addGroupUser(
        props.tenant.id,
        group.id,
        authStore.authenticatedUser,
      )

      notification.success('User added to Group Successfully')
    } catch (error: unknown) {
      if (error instanceof DomainError && error.userMessage) {
        // For any other API Domain Error, display the user message that comes
        // from the API. This should not happen but is useful if there are
        // business rules in the API that are not implemented in the UI.
        notification.error(error.userMessage)
      } else {
        // Otherwise display a generic error message.
        notification.error('Failed to add the user to the new group')
      }
    }
  }
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroups(props.tenant.id)
  } catch {
    notification.error('Failed to load tenant groups')
  }
})
</script>

<template>
  <h4 class="mb-6">Groups</h4>

  <ButtonPrimary
    v-if="isUserAdmin"
    class="mb-12"
    text="Create a Group"
    @click="dialogOpen"
  />

  <GroupList
    v-if="!groupStore.loading && groupStore.groups.length > 0"
    :groups="groupStore.groups"
    :is-admin="isUserAdmin"
    @select="handleCardClick"
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
