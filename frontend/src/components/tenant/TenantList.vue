<script setup lang="ts">
import { computed } from 'vue'

import TenantListCard from '@/components/tenant/TenantListCard.vue'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenants } = defineProps<{
  tenants: Tenant[]
}>()

const emit = defineEmits<{
  select: [id: Tenant['id']]
}>()

// --- Computed Values ---------------------------------------------------------

const sortedTenants = computed(() => {
  return [...tenants].sort((a, b) => a.name.localeCompare(b.name))
})

// --- Component Methods -------------------------------------------------------

const handleClick = (id: Tenant['id']) => {
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
