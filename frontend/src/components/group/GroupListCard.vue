<script setup lang="ts">
import { type Group } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

const { group } = defineProps<{
  group: Group
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
    <v-card-title class="card-link">{{ group.name }}</v-card-title>
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
