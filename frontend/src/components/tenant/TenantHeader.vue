<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'

const props = defineProps<{
  tenant?: Tenant
  deleteDialog: boolean
}>()

const emit = defineEmits<{
  (e: 'update:deleteDialog', value: boolean): void
}>()
</script>

<template>
  <v-sheet class="pa-4" width="100%" color="grey-lighten-3">
    <v-row>
      <v-col cols="6">
        <h1>{{ tenant?.name }}</h1>
      </v-col>
      <v-col cols="6" class="d-flex justify-end">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title>Edit Tenant</v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('update:deleteDialog', true)">
              <v-list-item-title>Delete Tenant</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-sheet>
</template>
