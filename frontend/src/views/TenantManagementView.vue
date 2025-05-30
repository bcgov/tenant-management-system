<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

import TenantHeader from '@/components/tenant/TenantHeader.vue'
import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantTabs from '@/components/tenant/TenantTabs.vue'
import { useTenantStore } from '@/stores/useTenantStore'

// Initialize stores and route
const route = useRoute()
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// Current tenant
const tenant = computed(() =>
  tenants.value.find((t) => t.id === route.params.id),
)

// Delete dialog state
const deleteDialogVisible = ref(false)

// Breadcrumbs for navigation
const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenants' },
  {
    title: tenant.value?.name || '',
    disabled: false,
    href: `/tenants/${tenant.value?.id}`,
  },
])
</script>

<template>
  <BaseSecure>
    <v-breadcrumbs :items="breadcrumbs" divider=">" color="primary" />

    <v-container fluid>
      <TenantHeader
        :tenant="tenant"
        v-model:delete-dialog="deleteDialogVisible"
      />

      <TenantDetails :tenant="tenant" />

      <TenantTabs :tenant="tenant" />
    </v-container>
  </BaseSecure>
</template>
