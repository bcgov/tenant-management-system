<script setup lang="ts">
import type { Group } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

const { group } = defineProps<{
  group: Group
  isAdmin: boolean
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
    <v-card-title>{{ group.name }}</v-card-title>
    <v-card-text>
      <span class="d-block p-small">Date Created: {{ group.createdDate }}</span>
      <span class="d-block p-small">Created By: {{ group.createdBy }}</span>

      <span class="card-link mt-4">
        <p v-if="isAdmin">Edit Group &rarr;</p>
        <p v-else>View Group &rarr;</p>
      </span>
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
