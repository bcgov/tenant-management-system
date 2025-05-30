<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'

defineProps<{
  tenant?: Tenant
}>()
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        :model-value="tenant?.ministryName"
        label="BC Ministry"
        readonly
        class="readonly-field"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        :model-value="tenant?.users[0]?.displayName"
        label="Tenant Owner"
        readonly
        class="readonly-field"
      />
    </v-col>
  </v-row>
</template>
