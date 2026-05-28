<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
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
const route = useRoute()

// --- Computed Values ---------------------------------------------------------

const groups = computed(() => groupStore.groups)

const tenant = computed(() => tenantStore.getTenant(props.tenantId))

// --- Component Lifecycle ---------------------------------------------------------

// Use init() in setup instead of a top-level await, so that loading state is
// set before first render. Look to Suspense when no longer experimental.
const initialized = ref(false)
const init = async () => {
  const [groupsResult, tenantResult] = await Promise.allSettled([
    groupStore.fetchGroups(props.tenantId),
    tenantStore.fetchTenant(props.tenantId),
  ])

  if (groupsResult.status === 'rejected') {
    notification.error('Failed to load groups')
  }

  if (tenantResult.status === 'rejected') {
    notification.error('Failed to load tenant')
  }

  initialized.value = true
}

init()
</script>

<template>
  <template v-if="initialized">
    <LoginContainer>
      <TenantHeader
        v-if="!route.params.groupId"
        :groups="groups!"
        :tenant="tenant!"
      />
      <router-view />
    </LoginContainer>
  </template>
</template>
