<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupDetails from '@/components/group/GroupDetails.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import GroupRoleContainer from '@/components/group/GroupRoleContainer.vue'
import UserManagementContainer from '@/components/group/UserManagementContainer.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { type GroupDetailFields, toGroupId } from '@/models/group.model'
import { Tenant, toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant
}>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const isDuplicateName = ref(false)
const isEditing = ref(false)
const showDetail = ref(true)
const tab = ref<number>(0)

// --- Computed Values ---------------------------------------------------------

const routeGroupId = computed(() =>
  Array.isArray(route.params.groupId)
    ? toGroupId(route.params.groupId[0])
    : toGroupId(route.params.groupId),
)

const routeTenantId = computed(() =>
  Array.isArray(route.params.tenantId)
    ? toTenantId(route.params.tenantId[0])
    : toTenantId(route.params.tenantId),
)

const group = computed(() => {
  return groupStore.getGroup(routeGroupId.value) || null
})

// --- Component Methods -------------------------------------------------------

async function handleUpdateGroup(updatedGroup: GroupDetailFields) {
  // Shouldn't happen as the template can't call this function when null.
  if (!group.value || !props.tenant) {
    return
  }

  try {
    await groupStore.updateGroupDetails(
      props.tenant.id,
      group.value.id,
      updatedGroup,
    )
    isEditing.value = false
    notification.success('Group Details Successfully Updated')
  } catch (error) {
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
      notification.error('Failed to update the group')
    }
  }
}

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroup(routeTenantId.value, routeGroupId.value)
  } catch {
    notification.error('Failed to load group')
  }

  try {
    await tenantStore.fetchTenant(routeTenantId.value)
  } catch {
    notification.error('Failed to load tenant')
  }
})
</script>

<template>
  <LoginContainer>
    <LoadingWrapper
      :loading="!group || !tenant"
      loading-message="Loading group..."
    >
      <GroupHeader v-model:show-detail="showDetail" :group="group!" />

      <GroupDetails
        v-if="showDetail"
        v-model:is-editing="isEditing"
        :group="group!"
        :is-duplicate-name="isDuplicateName"
        :tenant="tenant"
        @clear-duplicate-error="isDuplicateName = false"
        @update="handleUpdateGroup"
      />

      <v-card class="mt-6" elevation="0">
        <v-tabs v-model="tab" :disabled="isEditing" :mandatory="false">
          <v-tab :value="0">Group Members</v-tab>
          <v-tab :value="1">Service Roles</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0">
            <UserManagementContainer :group="group!" :tenant="tenant" />
          </v-window-item>
          <v-window-item :value="1">
            <GroupRoleContainer :group="group!" :tenant="tenant" />
          </v-window-item>
        </v-window>
      </v-card>
    </LoadingWrapper>
  </LoginContainer>
</template>

<style>
/* This has to be important because the other one is also important... */
.v-input.v-input--disabled.noBackground .v-input__control {
  background-color: transparent !important;
}
</style>
