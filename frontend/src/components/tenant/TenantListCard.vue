<script setup lang="ts">
import { computed } from 'vue'

import type { Tenant } from '@/models'

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

const owner = computed(() => {
  return tenant.getOwners()?.[0]
})
</script>

<template>
  <v-card class="hoverable" color="surface-light-gray" @click="emit('click')">
    <v-card-title>
      <span class="card-link">
        {{ tenant.name }}
      </span>
    </v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="owner">
      <p>Tenant Owner: {{ owner.displayName }}</p>
      <p>{{ owner.email }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.card-link {
  color: rgb(var(--v-theme-typography-link-color)) !important;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.card-link:hover {
  color: rgb(var(--v-theme-typography-link-color-hover)) !important;
}
</style>
