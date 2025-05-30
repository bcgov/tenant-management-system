<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import TenantTabs from '@/components/tenant/TenantTabs.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import { Tenant } from '@/models/tenant.model'
import { useTenantStore } from '@/stores/useTenantStore'

// Initialize stores and route
const route = useRoute()
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// Current tenant
const tenant = computed(() =>
  tenants.value.find((t) => t.id === route.params.id),
)

// UI state
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
    <BreadcrumbBar :items="breadcrumbs" />

    <v-container fluid>
      <TenantHeader
        :tenant="tenant"
        v-model:delete-dialog="deleteDialogVisible"
        v-model:is-editing="isEditing"
      />

      <TenantDetails
        :tenant="tenant"
        :is-editing="isEditing"
        @update="handleUpdate"
      />

      <TenantTabs :tenant="tenant" :disabled="isEditing" />
    </v-container>
  </BaseSecure>
</template>
