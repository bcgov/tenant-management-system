<script setup lang="ts">
import { computed, ref } from 'vue'

import GroupHeader from '@/components/group/GroupHeader.vue'
import { useNotification } from '@/composables/useNotification'
import { type GroupId } from '@/models/group.model'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
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

const group = computed(() => groupStore.getGroup(props.groupId))

const tenant = computed(() => tenantStore.getTenant(props.tenantId))

// --- Component Lifecycle -----------------------------------------------------

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const initialized = ref(false)
const init = async () => {
  const [groupResult, groupServicesResult] = await Promise.allSettled([
    groupStore.fetchGroup(props.tenantId, props.groupId),
    groupStore.fetchGroupServices(props.tenantId, props.groupId),
  ])

  if (groupResult.status === 'rejected') {
    notification.error('Failed to load group')
  }

  if (groupServicesResult.status === 'rejected') {
    notification.error('Failed to load group servicess')
  }

  initialized.value = true
}

init()
</script>

<template>
  <template v-if="initialized">
    <GroupHeader
      :enabled-roles-count="enabledRolesCount"
      :enabled-service-count="enabledServiceCount"
      :group="group!"
      :tenant="tenant!"
    />

    <router-view />
  </template>
</template>
