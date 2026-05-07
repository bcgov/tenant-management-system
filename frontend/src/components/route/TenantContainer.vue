<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import TenantHeader from '@/components/tenant/TenantHeader.vue'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useGroupStore } from '@/stores/useGroupStore'
import { useNotification } from '@/composables/useNotification'
import { toTenantId } from '@/models/tenant.model'
import { useTenantStore } from '@/stores/useTenantStore'

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

const routeTenantId = computed(() =>
  Array.isArray(route.params.tenantId)
    ? toTenantId(route.params.tenantId[0])
    : toTenantId(route.params.tenantId),
)

const groups = computed(() => groupStore.groups)
const tenant = computed(
  () => tenantStore.getTenant(routeTenantId.value) || null,
)

onMounted(async () => {
  try {
    await groupStore.fetchGroups(routeTenantId.value)
  } catch {
    notification.error('Failed to load groups')
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
      :loading="!groups || !tenant"
      loading-message="Loading tenant..."
    >
      <TenantHeader :groups="groups!" :tenant="tenant!" />
    </LoadingWrapper>
  </LoginContainer>
</template>
