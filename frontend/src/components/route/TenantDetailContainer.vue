<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useGroupStore } from '@/stores/useGroupStore'
import { useNotification } from '@/composables/useNotification'
import { toTenantId } from '@/models/tenant.model'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Store and Composable Setup ----------------------------------------------

const groupStore = useGroupStore()
const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

// --- Watchers and Effects ----------------------------------------------------

// Close the tenant details when the user navigates to a different aspect of the
// tenant (users, groups, services).
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      showDetail.value = false
    }
  },
)

// --- Computed Values ---------------------------------------------------------

const groups = computed(() => groupStore.groups)

const routeTenantId = computed(() =>
  Array.isArray(route.params.tenantId)
    ? toTenantId(route.params.tenantId[0])
    : toTenantId(route.params.tenantId),
)

const tenant = computed(() => {
  return tenantStore.getTenant(routeTenantId.value) || null
})

// --- Component Lifecycle -----------------------------------------------------

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
      <TenantHeader v-model:show-detail="showDetail" :tenant="tenant!" />

      <TenantDetails v-if="showDetail" :groups="groups!" :tenant="tenant!" />

      <router-view :tenant="tenant" />
    </LoadingWrapper>
  </LoginContainer>
</template>
