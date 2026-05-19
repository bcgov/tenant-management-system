<script setup lang="ts">
import { computed, onMounted } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { type GroupId } from '@/models/group.model'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{ groupId: GroupId; tenantId: TenantId }>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const tenantStore = useTenantStore()

// --- Computed Values ---------------------------------------------------------

const enabledRolesCount = computed(() =>
  groupStore.groupServices.reduce(
    (sum, service) => sum + service.enabledRolesCount,
    0,
  ),
)

const enabledServiceCount = computed(
  () =>
    groupStore.groupServices.filter((service) => service.hasEnabledRoles)
      .length,
)

const group = computed(() => groupStore.getGroup(props.groupId))

const tenant = computed(() => tenantStore.getTenant(props.tenantId))

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroup(props.tenantId, props.groupId)
  } catch {
    notification.error('Failed to load group')
  }

  try {
    await groupStore.fetchGroupServices(props.tenantId, props.groupId)
  } catch {
    notification.error('Failed to load group services')
  }

  try {
    await tenantStore.fetchTenant(props.tenantId)
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
      <GroupHeader
        :enabled-roles-count="enabledRolesCount"
        :enabled-service-count="enabledServiceCount"
        :group="group!"
        :tenant="tenant!"
      />

      <router-view :group="group" :tenant="tenant" />
    </LoadingWrapper>
  </LoginContainer>
</template>
