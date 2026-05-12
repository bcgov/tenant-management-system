<script setup lang="ts">
import { computed, onMounted } from 'vue'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{ tenantId: TenantId }>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const tenantStore = useTenantStore()

// --- Computed Values ---------------------------------------------------------

const groups = computed(() => groupStore.groups)

const tenant = computed(() => tenantStore.getTenant(props.tenantId))

// --- Component Lifecycle ---------------------------------------------------------

onMounted(async () => {
  try {
    await groupStore.fetchGroups(props.tenantId)
  } catch {
    notification.error('Failed to load groups')
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
      :loading="!groups || !tenant"
      loading-message="Loading tenant..."
    >
      <TenantHeader :groups="groups!" :tenant="tenant!" />
    </LoadingWrapper>
  </LoginContainer>
</template>
