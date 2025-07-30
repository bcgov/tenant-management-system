<script setup lang="ts">
import type { Group } from '@/models'

// --- Component Interface -----------------------------------------------------

const { group } = defineProps<{
  isAdmin: boolean
  group: Group
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
</script>

<template>
  <v-card class="hoverable" color="surface-light-gray" @click="emit('click')">
    <v-card-title>
      <h4>{{ group.name }}</h4>
    </v-card-title>
    <v-card-text>
      <p class="p-small">Date Created: {{ group.createdDate }}</p>
      <p class="p-small">Created By: {{ group.createdBy }}</p>

      <span class="card-link">
        <p v-if="isAdmin" class="mt-4">Edit Group &rarr;</p>
        <p v-else class="mt-4">View Group &rarr;</p>
      </span>
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
