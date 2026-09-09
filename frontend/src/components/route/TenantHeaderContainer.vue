<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { type TenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const { tenantId } = defineProps<{ tenantId: TenantId }>()

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Computed Values ---------------------------------------------------------

const groups = computed(() => groupStore.groups)

const tenant = computed(() => tenantStore.getTenant(tenantId))

// --- Component Lifecycle ---------------------------------------------------------

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  const [groupsResult, tenantResult] = await Promise.allSettled([
    groupStore.fetchGroups(tenantId),
    tenantStore.fetchTenant(tenantId),
  ])

  if (groupsResult.status === 'rejected') {
    notification.error('Failed to load groups')
  }

  if (tenantResult.status === 'rejected') {
    notification.error('Failed to load tenant')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoginContainer>
    <LoadingWrapper :loading="!initialized" loading-message="Loading tenant...">
      <TenantHeader
        v-if="!route.params.groupId"
        :groups="groups!"
        :tenant="tenant!"
      />
      <router-view />
    </LoadingWrapper>
  </LoginContainer>
</template>
