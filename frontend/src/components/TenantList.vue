<script setup lang="ts">
import TenantCard from './TenantCard.vue'
import type { PropType } from 'vue'
import type { Tenant } from '@/models/Tenant'

const props = defineProps({
  tenants: {
    type: Array as PropType<Tenant[]>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()
</script>

<template>
  <v-row>
    <v-col
      v-for="tenant in tenants"
      :key="tenant.id"
      cols="12"
      md="4"
    >
      <TenantCard :tenant="tenant" @click="emit('select', tenant.id)" />
    </v-col>
  </v-row>
</template>
