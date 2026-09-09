<script setup lang="ts">
import { computed, ref } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { type GroupId } from '@/models/group.model'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const { groupId, tenantId } = defineProps<{
  groupId: GroupId
  tenantId: TenantId
}>()

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

const group = computed(() => groupStore.getGroup(groupId))

const tenant = computed(() => tenantStore.getTenant(tenantId))

// --- Component Lifecycle -----------------------------------------------------

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  const [groupResult, groupServicesResult] = await Promise.allSettled([
    groupStore.fetchGroup(tenantId, groupId),
    groupStore.fetchGroupServices(tenantId, groupId),
  ])

  if (groupResult.status === 'rejected') {
    notification.error('Failed to load group')
  }

  if (groupServicesResult.status === 'rejected') {
    notification.error('Failed to load group servicess')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoginContainer>
    <LoadingWrapper :loading="!initialized" loading-message="Loading group...">
      <GroupHeader
        :enabled-roles-count="enabledRolesCount"
        :enabled-service-count="enabledServiceCount"
        :group="group!"
        :tenant="tenant!"
      />
      <router-view />
    </LoadingWrapper>
  </LoginContainer>
</template>
