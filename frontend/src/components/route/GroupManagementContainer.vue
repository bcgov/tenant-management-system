<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupDetails from '@/components/group/GroupDetails.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { type GroupDetailFields } from '@/models'
import { useGroupStore, useTenantStore } from '@/stores'

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const isDuplicateName = ref(false)
const isEditing = ref(false)
const showDetail = ref(true)

// --- Computed Values ---------------------------------------------------------

const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenants' },
  {
    title: tenant.value.name,
    disabled: false,
    href: `/tenants/${routeTenantId.value}`,
  },
  {
    title: 'User Management',
    disabled: false,
    href: `/tenants/${routeTenantId.value}`,
  },
  {
    title: 'Group Details',
    disabled: false,
    href: `/groups/${routeGroupId.value}`,
  },
])

const routeGroupId = computed(() =>
  Array.isArray(route.params.groupId)
    ? route.params.groupId[0]
    : route.params.groupId,
)

const routeTenantId = computed(() =>
  Array.isArray(route.params.tenantId)
    ? route.params.tenantId[0]
    : route.params.tenantId,
)

const group = computed(() => {
  return groupStore.getGroup(routeGroupId.value) || null
})

const tenant = computed(() => {
  return tenantStore.getTenant(routeTenantId.value) || null
})

// --- Component Methods -------------------------------------------------------

async function handleUpdateGroup(updatedGroup: GroupDetailFields) {
  try {
    await groupStore.updateGroupDetails(
      tenant.value.id,
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
    await tenantStore.fetchTenant(routeTenantId.value)
  } catch {
    notification.error('Failed to load group')
  }
})
</script>

<template>
  <LoginContainer>
    <LoadingWrapper
      :loading="!group || !tenant"
      loading-message="Loading group..."
    >
      <BreadcrumbBar :items="breadcrumbs" class="mb-6" />

      <GroupHeader v-model:show-detail="showDetail" :group="group" />

      <GroupDetails
        v-if="showDetail"
        v-model:is-editing="isEditing"
        :group="group"
        :is-duplicate-name="isDuplicateName"
        :tenant="tenant"
        @clear-duplicate-error="isDuplicateName = false"
        @update="handleUpdateGroup"
      />
    </LoadingWrapper>
  </LoginContainer>
</template>
