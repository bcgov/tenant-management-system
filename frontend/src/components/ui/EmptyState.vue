<script setup lang="ts">
import { computed } from 'vue'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  body: string
  title: string
  variant: 'lookup' | 'page' | 'table'
}>()

// --- Computed Values ---------------------------------------------------------

const color = computed(() =>
  props.variant === 'lookup' ? 'surface-white' : 'surface-light-gray',
)
</script>

<template>
  <v-sheet :color="color" class="ma-0">
    <h5 class="mb-2">{{ title }}</h5>
    <p class="mt-0">{{ body }}</p>
  </v-sheet>
</template>
