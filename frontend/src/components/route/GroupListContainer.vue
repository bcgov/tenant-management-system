<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import GroupCreateDialog from '@/components/group/GroupCreateDialog.vue'
import GroupList from '@/components/group/GroupList.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ServerError } from '@/errors/domain/ServerError'
import { Group, type GroupDetailFields } from '@/models/group.model'
import { type TenantId } from '@/models/tenant.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenantId: TenantId
}>()

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const groupStore = useGroupStore()
const notification = useNotification()
const router = useRouter()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const dialogVisible = ref(false)
const isDuplicateName = ref(false)

// --- Computed Values ---------------------------------------------------------

const groups = computed(() => groupStore.groups)

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(tenant.value, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(tenant.value, ROLES.USER_ADMIN.value)
  )
})

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(props.tenantId)
  if (!tenant) {
    throw new Error(`Tenant ${props.tenantId} not found`)
  }

  return tenant
})

// --- Component Methods -------------------------------------------------------

const dialogClose = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

const dialogOpen = () => (dialogVisible.value = true)

const handleCardClick = (id: Group['id']) => {
  router.push(`/tenants/${props.tenantId}/groups/${id}/members`)
}

const handleGroupCreate = async (
  groupDetails: GroupDetailFields,
  addUser: boolean,
) => {
  let group: Group

  try {
    group = await groupStore.addGroup(
      props.tenantId,
      groupDetails.name,
      groupDetails.description,
    )

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
      notification.error(error.userMessage)
    } else if (error instanceof ServerError) {
      notification.error(error.userMessage ?? 'Failed to create the new group')
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
        props.tenantId,
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
</script>

<template>
  <v-container class="ms-6">
    <template v-if="groups.length > 0">
      <h4>Groups</h4>

      <ButtonPrimary
        v-if="isUserAdmin"
        class="mb-12"
        text="Create a Group"
        @click="dialogOpen"
      />

      <GroupList :groups="groups" @select="handleCardClick" />
    </template>
    <v-container v-else class="fill-height">
      <v-row class="center-align justify-center">
        <v-col class="align-center d-flex flex-column" cols="auto">
          <h1>No groups yet</h1>
          <p class="p-large">
            No groups have been created for this tenant yet.
            <span v-if="isUserAdmin">
              Create your first group to get started.
            </span>
          </p>

          <p v-if="isUserAdmin">
            <ButtonPrimary text="Create a Group" @click="dialogOpen" />
          </p>

          <span class="mt-12 p-small">
            Groups help you manage access for multiple users at once and keep
            role assignments consistent.
          </span>
        </v-col>
      </v-row>
    </v-container>
  </v-container>

  <GroupCreateDialog
    v-model="dialogVisible"
    :is-duplicate-name="isDuplicateName"
    @clear-duplicate-error="isDuplicateName = false"
    @submit="handleGroupCreate"
  />
</template>
