<script setup lang="ts">
// --- Types & Interfaces ------------------------------------------------------

interface Breadcrumb {
  disabled?: boolean
  href?: string
  title: string
}

// --- Component Interface -----------------------------------------------------

defineProps<{
  items: Breadcrumb[]
}>()
</script>

<template>
  <v-breadcrumbs :items="items" color="primary">
    <template #divider>
      <v-icon icon="mdi-chevron-right"></v-icon>
    </template>
  </v-breadcrumbs>
</template>
