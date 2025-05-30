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
const tenancy = computed(() =>
  tenants.value.find((t) => t.id === route.params.id),
)

// Delete dialog state
const deleteDialogVisible = ref(false)

// Breadcrumbs for navigation
const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenancies' },
  {
    title: tenancy.value?.name || '',
    disabled: false,
    href: `/tenancies/${tenancy.value?.id}`,
  },
])
</script>

<template>
  <BaseSecure>
    <v-breadcrumbs :items="breadcrumbs" divider=">" color="primary" />

    <v-container fluid>
      <TenantHeader
        :tenant="tenancy"
        v-model:delete-dialog="deleteDialogVisible"
      />

      <TenantDetails :tenant="tenancy" />

      <TenantTabs :tenant="tenancy" />
    </v-container>
  </BaseSecure>
</template>
