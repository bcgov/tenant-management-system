<script setup lang="ts">
import TenantCard from '@/components/TenantCard.vue'
import type { Tenant } from '@/models'

defineProps<{
  tenants: Tenant[]
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'select', id: Tenant['id']): void // NOSONAR: S6598
}>()

const handleClick = (id: Tenant['id']) => emit('select', id)
</script>

<template>
  <v-row>
    <v-col v-for="tenant in tenants" :key="tenant.id" cols="12" md="4">
      <TenantCard :tenant="tenant" @click="handleClick(tenant.id)" />
    </v-col>
  </v-row>
</template>
