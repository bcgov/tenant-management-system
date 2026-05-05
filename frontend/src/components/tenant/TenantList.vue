<script setup lang="ts">
import { computed } from 'vue'

import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenants: Tenant[]
}>()

const emit = defineEmits<{
  (event: 'select', id: Tenant['id']): void
}>()

// --- Computed Values ---------------------------------------------------------

const sortedTenants = computed(() => {
  return [...props.tenants].sort((a, b) => a.name.localeCompare(b.name))
})

// --- Component Methods -------------------------------------------------------

function handleClick(id: Tenant['id']) {
  emit('select', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="tenant in sortedTenants" :key="tenant.id" cols="12" md="4">
      <TenantListCard :tenant="tenant" @click="handleClick(tenant.id)" />
    </v-col>
  </v-row>
</template>
