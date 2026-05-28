<script setup lang="ts">
import { mdiCheckCircleOutline } from '@mdi/js'

import { type Service } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  service: Service
}>()
</script>

<template>
  <v-card color="surface-light-gray">
    <v-card-title>{{ service.displayName }}</v-card-title>
    <v-card-subtitle>{{ service.description }}</v-card-subtitle>
    <v-card-text>
      <v-icon :icon="mdiCheckCircleOutline" color="green" /> Added
    </v-card-text>
  </v-card>
</template>
