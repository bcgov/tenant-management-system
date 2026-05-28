<script setup lang="ts">
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenant } = defineProps<{
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'click'): void
}>()
</script>

<template>
  <v-card
    class="hoverable pb-4"
    color="surface-light-gray"
    @click="emit('click')"
  >
    <v-card-title>
      <span class="card-link">{{ tenant.name }}</span>
    </v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
  </v-card>
</template>

<style scoped>
.card-link {
  color: rgb(var(--v-theme-typography-link-color)) !important;
  cursor: pointer;
  transition: color 0.2s ease;
}

.card-link:hover {
  color: rgb(var(--v-theme-typography-link-color-hover)) !important;
}
</style>
