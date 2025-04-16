<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { Tenant } from '@/models/Tenant'

const props = defineProps({
  tenant: {
    type: Object as PropType<Tenant>,
    required: true,
  },
})

const firstAdminUser = computed(() => props.tenant.getAdminUsers()[0])
console.log('firstAdminUser', firstAdminUser.value)
</script>

<template>
  <v-card @click="$emit('click')" class="hoverable">
    <v-card-title>{{ tenant.name }}</v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="firstAdminUser">
      <p>Tenant Owner/Admin: {{ firstAdminUser.ssoUser.displayName }}</p>
      <p>{{ firstAdminUser.ssoUser.email }}</p>
    </v-card-text>
  </v-card>
</template>
