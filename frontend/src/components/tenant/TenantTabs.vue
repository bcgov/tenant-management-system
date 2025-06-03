<script setup lang="ts">
import { ref } from 'vue'
import type { Tenant } from '@/models/tenant.model'

defineProps<{
  disabled?: boolean
  tenant?: Tenant
}>()

const tab = ref<number | null>(null)
</script>

<template>
  <v-card elevation="0">
    <v-tabs v-model="tab" :mandatory="false" :disabled="disabled">
      <v-tab :value="1">User Management</v-tab>
      <v-tab :value="2">Available Services</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item :value="1">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <p>Content for User Management tab</p>
            </v-col>
          </v-row>
        </v-container>
      </v-tabs-window-item>

      <v-tabs-window-item :value="2">
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <p>Content for Available Services tab</p>
            </v-col>
          </v-row>
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
