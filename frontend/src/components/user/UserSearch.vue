<script setup lang="ts">
import { ref, watch } from 'vue'

import type { User } from '@/models'

const props = defineProps<{
  tenantId: string
  loading?: boolean
  results: User[]
}>()

const emit = defineEmits<{
  (event: 'select', user: User): void
  (event: 'search', query: Record<string, string>): void
}>()

// Local UI state
const searchOption = ref<'firstName' | 'lastName' | 'email'>('firstName')
const searchText = ref('')
const selectedUser = ref<User[]>([])

const SEARCH_OPTIONS = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
] as const

// Emit when a user is selected
watch(selectedUser, (selection) => {
  if (selection?.length) {
    emit('select', selection[0])
  }
})

function search() {
  if (!searchOption.value || !searchText.value) return
  emit('search', { [searchOption.value]: searchText.value })
}

function reset() {
  searchText.value = ''
  selectedUser.value = []
  searchOption.value = 'firstName'
}
defineExpose({ reset })
</script>

<template>
  <div class="mb-12">
    1. Search for a user based on the selection criteria below:
  </div>

  <v-row>
    <v-col md="2">
      <v-select
        v-model="searchOption"
        label="Search by"
        :items="SEARCH_OPTIONS"
        hide-details
      />
    </v-col>
    <v-col md="4">
      <v-text-field
        v-model="searchText"
        label="Search text"
        @keyup.enter="search"
        hide-details
      />
    </v-col>
    <v-col md="2" class="d-flex align-center">
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!searchText"
        @click="search"
      >
        Search
      </v-btn>
    </v-col>
  </v-row>

  <v-row v-if="results.length || loading">
    <v-col cols="12">
      <v-data-table
        v-model="selectedUser"
        :items="results"
        :headers="[
          { title: 'First Name', key: 'firstName', align: 'start' },
          { title: 'Last Name', key: 'lastName', align: 'start' },
          { title: 'Email', key: 'email', align: 'start' },
        ]"
        :loading="loading"
        return-object
        select-strategy="single"
        show-select
        :header-props="{
          class: 'text-body-1 font-weight-bold bg-surface-light',
        }"
      >
        <template #no-data>
          <v-alert type="info">Search for users to add</v-alert>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>
