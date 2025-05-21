<script setup lang="ts">
import { computed } from 'vue'

import type { Tenancy } from '@/models/tenancy.model'

const { tenancy } = defineProps<{
  tenancy: Tenancy
}>()

type EmitFn = (event: 'click') => void
const emit = defineEmits<EmitFn>()

const firstAdminUser = computed(() => tenancy.getAdminUsers()[0])
</script>

<template>
  <v-card @click="emit('click')" class="hoverable bg-grey-lighten-4">
    <v-card-title>
      <span class="card-link">
        {{ tenancy.name }}
      </span>
    </v-card-title>
    <v-card-subtitle>{{ tenancy.ministryName }}</v-card-subtitle>
    <v-card-text v-if="firstAdminUser">
      <p>Tenancy Owner: {{ firstAdminUser.ssoUser?.displayName }}</p>
      <p>{{ firstAdminUser.ssoUser?.email }}</p>
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
