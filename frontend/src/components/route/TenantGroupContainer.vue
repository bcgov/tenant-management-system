<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'
import { type GroupRoleType, useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Computed Values ---------------------------------------------------------

const enabledRolesCount = computed(
  () =>
    Object.values(groupStore.groupRoles as GroupRoleType)
      .flat()
      .filter((role) => role.enabled).length,
)

const enabledServiceCount = computed(
  () =>
    Object.values(groupStore.groupRoles as GroupRoleType).filter((roles) =>
      roles.some((role) => role.enabled),
    ).length,
)

const group = computed(() => groupStore.getGroup(routeGroupId.value))

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

const tenant = computed(() => tenantStore.getTenant(routeTenantId.value))

// --- Component Lifecycle -----------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroup(routeTenantId.value, routeGroupId.value)
  } catch {
    notification.error('Failed to load group')
  }

  try {
    await groupStore.fetchRoles(routeTenantId.value, routeGroupId.value)
  } catch {
    notification.error('Failed to load group roles')
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
