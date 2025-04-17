<script setup lang="ts">
import { computed } from 'vue'

import type { Tenant } from '@/models/tenant.model'

const { tenant } = defineProps<{
  tenant: Tenant
}>()

type EmitFn = (event: 'click') => void
const emit = defineEmits<EmitFn>()

const firstAdminUser = computed(() => tenant.getAdminUsers()[0])
</script>

<template>
  <v-card @click="emit('click')" class="hoverable">
    <v-card-title>{{ tenant.name }}</v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="firstAdminUser">
      <p>Tenant Owner/Admin: {{ firstAdminUser.ssoUser.displayName }}</p>
      <p>{{ firstAdminUser.ssoUser.email }}</p>
    </v-card-text>
  </v-card>
</template>
