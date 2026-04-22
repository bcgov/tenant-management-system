<script setup lang="ts">
import { computed } from 'vue'

import type { Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const { tenant } = defineProps<{
  tenant: Tenant
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
  (event: 'click'): void // NOSONAR: S6598
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
