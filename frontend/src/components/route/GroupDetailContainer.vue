<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import GroupDetails from '@/components/group/GroupDetails.vue'
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

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

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
  return groupStore.getGroup(routeGroupId.value)
})

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

const tenant = computed(() => {
  return tenantStore.getTenant(routeTenantId.value)
})

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
        v-model:show-detail="showDetail"
        :group="group!"
        :tenant="tenant!"
      />

      <GroupDetails
        v-if="showDetail"
        :group="group!"
        :group-enabled-service-count="enabledServiceCount"
        :group-enabled-service-role-count="enabledRolesCount"
        :tenant="tenant!"
      />

      <router-view :group="group" :tenant="tenant" />
    </LoadingWrapper>
  </LoginContainer>
</template>

<style>
/* This has to be important because the other one is also important... */
.v-input.v-input--disabled.noBackground .v-input__control {
  background-color: transparent !important;
}
</style>
