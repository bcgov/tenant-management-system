<script setup lang="ts">
import { computed } from 'vue'

import type { Tenant } from '@/models/tenant.model'

const { tenant } = defineProps<{
  tenant: Tenant
}>()

type EmitFn = (event: 'click') => void
const emit = defineEmits<EmitFn>()

const firstOwner = computed(() => tenant.getOwners()[0])
</script>

<template>
  <v-card @click="emit('click')" class="hoverable bg-grey-lighten-4">
    <v-card-title>
      <span class="card-link">
        {{ tenant.name }}
      </span>
    </v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="firstOwner">
      <p>Tenant Owner: {{ firstOwner.displayName }}</p>
      <p>{{ firstOwner.email }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.card-link {
  color: #1a73e8;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

.card-link:hover {
  color: #1558b0;
}
</style>
