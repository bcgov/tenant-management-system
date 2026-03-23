<script setup lang="ts">
import { mdiChevronRight } from '@mdi/js'

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
      <v-icon :icon="mdiChevronRight" />
    </template>
  </v-breadcrumbs>
</template>
