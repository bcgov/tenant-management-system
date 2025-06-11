<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import TenantTabs from '@/components/tenant/TenantTabs.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import { Tenant } from '@/models/tenant.model'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'

// Initialize stores and route
const route = useRoute()
const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const tenant = ref<Tenant | undefined>()

onMounted(async () => {
  await roleStore.fetchRoles()
})

// Watch for route changes and load tenant data
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      tenant.value = await tenantStore.fetchTenant(newId as string)
    }
  },
  { immediate: true },
)

// UI state
const showDetail = ref(true)
const deleteDialogVisible = ref(false)
const isEditing = ref(false)

// Breadcrumbs for navigation
const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenants' },
  {
    title: tenant.value?.name || '',
    disabled: false,
    href: `/tenants/${tenant.value?.id}`,
  },
])

const roles = computed(() => roleStore.roles)

async function handleUpdate(updatedTenant: Partial<Tenant>) {
  try {
    await tenantStore.updateTenant({
      ...tenant.value,
      ...updatedTenant,
    })
    isEditing.value = false
  } catch (error) {
    console.error('Failed to update tenant:', error)
    // TODO: Add error handling
  }
}
</script>

<template>
  <BaseSecure>
    <v-container fluid class="px-4">
      <BreadcrumbBar :items="breadcrumbs" class="mb-6" />

      <TenantHeader :tenant="tenant" v-model:show-detail="showDetail" />

      <TenantDetails
        v-if="showDetail"
        :tenant="tenant"
        v-model:delete-dialog="deleteDialogVisible"
        v-model:is-editing="isEditing"
        @update="handleUpdate"
      />

      <TenantTabs
        :disabled="isEditing"
        :roles="roles"
        :tenant="tenant"
        class="mt-6"
      />
    </v-container>
  </BaseSecure>
</template>
