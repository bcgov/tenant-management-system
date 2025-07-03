<script setup lang="ts">
import { ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import type { User } from '@/models'

defineProps<{
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
  if (searchOption.value && searchText.value) {
    emit('search', { [searchOption.value]: searchText.value })
  }
}

function reset() {
  searchText.value = ''
  selectedUser.value = []
  searchOption.value = 'firstName'
}
defineExpose({ reset })
</script>

<template>
  <v-row>
    <v-col md="2">
      <v-select
        v-model="searchOption"
        :items="SEARCH_OPTIONS"
        label="Search by"
        hide-details
      />
    </v-col>
    <v-col md="4">
      <v-text-field
        v-model="searchText"
        label="Search text"
        hide-details
        @keyup.enter="search"
      />
    </v-col>
    <v-col class="d-flex align-center" md="2">
      <ButtonPrimary :disabled="!searchText" text="Search" @click="search" />
    </v-col>
  </v-row>

  <v-row v-if="results.length || loading">
    <v-col cols="12">
      <h2 class="my-6">Search Results</h2>

      <v-data-table
        v-model="selectedUser"
        :header-props="{
          class: 'text-body-1 font-weight-bold bg-surface-light',
        }"
        :headers="[
          { title: 'First Name', key: 'firstName', align: 'start' },
          { title: 'Last Name', key: 'lastName', align: 'start' },
          { title: 'Email', key: 'email', align: 'start' },
        ]"
        :items="results"
        :loading="loading"
        select-strategy="single"
        return-object
        show-select
      >
        <template #no-data>
          <v-alert type="info">Search for users to add</v-alert>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>
