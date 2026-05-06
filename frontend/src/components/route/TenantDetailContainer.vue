<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { toTenantId } from '@/models/tenant.model'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const route = useRoute()
const tenantStore = useTenantStore()

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

// --- Computed Values ---------------------------------------------------------

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
    await tenantStore.fetchTenant(routeTenantId.value)
  } catch {
    notification.error('Failed to load tenant')
  }
})
</script>

<template>
  <LoginContainer>
    <LoadingWrapper :loading="!tenant" loading-message="Loading tenant...">
      <TenantHeader v-model:show-detail="showDetail" :tenant="tenant!" />

      <TenantDetails v-if="showDetail" :tenant="tenant!" />

      <router-view :tenant="tenant" />
    </LoadingWrapper>
  </LoginContainer>
</template>
