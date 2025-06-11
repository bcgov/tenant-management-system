<script setup lang="ts">
import TenantCard from '@/components/TenantCard.vue'
import type { Tenant } from '@/models'

defineProps<{ tenants: Tenant[] }>()

type EmitFn = (event: 'select', id: Tenant['id']) => void
const emit = defineEmits<EmitFn>()

const handleClick = (id: Tenant['id']) => emit('select', id)
</script>

<template>
  <v-row>
    <v-col v-for="tenant in tenants" :key="tenant.id" cols="12" md="4">
      <TenantCard :tenant="tenant" @click="handleClick(tenant.id)" />
    </v-col>
  </v-row>
</template>
