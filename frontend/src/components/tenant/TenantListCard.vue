<script setup lang="ts">
import { computed } from 'vue'

import type { Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenant } = defineProps<{
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'click'): void
}>()

// --- Computed Values ---------------------------------------------------------

const owner = computed(() => {
  return tenant.getFirstOwner()
})
</script>

<template>
  <v-card class="hoverable" color="surface-light-gray" @click="emit('click')">
    <v-card-title>
      <span class="card-link">{{ tenant.name }}</span>
    </v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="owner">
      <span class="d-block p-small">
        {{ $t('roles.owner') }}: {{ owner.ssoUser.displayName }}
      </span>
      <span class="d-block p-small">{{ owner.ssoUser.email }}</span>
    </v-card-text>
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
