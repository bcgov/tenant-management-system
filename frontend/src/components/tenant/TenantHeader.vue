<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'

const props = defineProps<{
  deleteDialog: boolean
  isEditing: boolean
  tenant?: Tenant
}>()

type EmitFn = {
  (event: 'update:deleteDialog', value: boolean): void
  (event: 'update:isEditing', value: boolean): void
}
const emit = defineEmits<EmitFn>()

function openDeleteDialog() {
  emit('update:deleteDialog', true)
}

function toggleEdit() {
  emit('update:isEditing', !props.isEditing)
}
</script>

<template>
  <v-sheet class="pa-4" width="100%" color="grey-lighten-3">
    <v-row>
      <v-col cols="6">
        <h1>Tenant Details</h1>
      </v-col>
      <v-col cols="1">
        Date Created: <strong>{{ tenant?.createdDateTime }}</strong>
      </v-col>
      <v-col cols="1">
        Created By: <strong>{{ tenant?.createdBy }}</strong>
      </v-col>
      <v-col cols="4" class="d-flex justify-end">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="toggleEdit">
              <v-list-item-title>{{
                isEditing ? 'Cancel Edit' : 'Edit Tenant'
              }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openDeleteDialog" :disabled="isEditing">
              <v-list-item-title>Delete Tenant</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-sheet>
</template>
