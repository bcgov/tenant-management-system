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
        :model-value="tenant?.name"
        label="Tenant Name"
        readonly
        class="readonly-field"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        :model-value="tenant?.ministryName"
        label="Ministry/Organization"
        readonly
        class="readonly-field"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        :model-value="tenant?.users[0]?.userName"
        label="Tenant Owner"
        readonly
        class="readonly-field"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        :model-value="tenant?.description"
        label="Tenant Description"
        readonly
        class="readonly-field"
      />
    </v-col>
  </v-row>
</template>
