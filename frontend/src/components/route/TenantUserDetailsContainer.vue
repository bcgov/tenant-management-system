<script setup lang="ts">
import { computed, ref } from 'vue'

import TenantUserDetails from '@/components/tenant/TenantUserDetails.vue'
import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'
import { useNotification } from '@/composables/useNotification'
import { NotFoundError } from '@/errors/domain/NotFoundError'
import { type TenantId } from '@/models/tenant.model'
import { type UserId } from '@/models/user.model'
import { useTenantStore } from '@/stores/useTenantStore'

// --- Component Interface -----------------------------------------------------

const { tenantId, userId } = defineProps<{
  tenantId: TenantId
  userId: UserId
}>()

// --- Store and Composable Setup ----------------------------------------------

const notification = useNotification()
const tenantStore = useTenantStore()

// --- Computed Values ---------------------------------------------------------

const tenant = computed(() => {
  const tenant = tenantStore.getTenant(tenantId)
  if (!tenant) {
    throw new NotFoundError(
      `tenantStore.getTenant(${tenantId}) returned null`,
      'Error loading tenant information',
    )
  }

  return tenant
})

const user = computed(() => {
  const user = tenant.value.findUserById(userId)
  if (!user) {
    throw new NotFoundError(
      `tenant(${tenantId}).findUserById(${userId}) returned null`,
      'Error loading user information',
    )
  }

  return user
})

// --- Component Lifecycle -----------------------------------------------------

const initialized = ref(false)

// Use an async function, and do not await since that would block rendering
// until the fetch resolves. This way setup() can complete synchronously while
// the fetch is happening, the component mounts immediately, and LoadingWrapper
// shows a spinner if needed. In the future use <Suspense> once it is no longer
// experimental.
const init = async () => {
  try {
    await tenantStore.fetchTenantUser(tenantId, userId)
  } catch {
    notification.error('Error loading user information')
  }

  initialized.value = true
}

// Sonar will complain (S7785) about top-level await because it doesn't
// understand that this is a Vue component. Ignore it until <Suspense> is used.
init() // NOSONAR
</script>

<template>
  <LoadingWrapper
    :loading="!initialized"
    loading-message="Loading tenant user..."
  >
    <v-container class="px-10">
      <TenantUserDetails :tenant="tenant" :user="user" />
    </v-container>
  </LoadingWrapper>
</template>
