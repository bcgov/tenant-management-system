<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import type { User } from '@/models'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

defineProps<{
  loading?: boolean
  searchResults: User[] | null
}>()

const emit = defineEmits<{
  (event: 'clear-search'): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
  (event: 'select', user: User): void
}>()

// Local UI state
const searchText = ref('')
const searchType = ref<IdirSearchType>(IDIR_SEARCH_TYPE.FIRST_NAME.value)
const selectedUser = ref<User[]>([])

// Redfine the list of search types so that they're in the order wanted by the
// component.
const SEARCH_TYPES = [
  {
    title: IDIR_SEARCH_TYPE.FIRST_NAME.title,
    value: IDIR_SEARCH_TYPE.FIRST_NAME.value,
  },
  {
    title: IDIR_SEARCH_TYPE.LAST_NAME.title,
    value: IDIR_SEARCH_TYPE.LAST_NAME.value,
  },
  { title: IDIR_SEARCH_TYPE.EMAIL.title, value: IDIR_SEARCH_TYPE.EMAIL.value },
]

watch([searchText, searchType], () => {
  emit('clear-search')
})

// Emit when a user is selected
watch(selectedUser, (selection) => {
  if (selection?.length) {
    emit('select', selection[0])
  }
})

// The SSO API will return a 400 if the search text is less than 2 characters.
const isSearchEnabled = computed(() => {
  return searchText.value && searchText.value.length >= 2
})

function search() {
  emit('search', searchType.value, searchText.value)
}
</script>

<template>
  <v-row>
    <v-col md="2">
      <v-select
        v-model="searchType"
        :items="SEARCH_TYPES"
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
      <ButtonPrimary
        :disabled="!isSearchEnabled"
        text="Search"
        @click="search"
      />
    </v-col>
  </v-row>

  <v-row v-if="searchResults !== null || loading">
    <v-col cols="12">
      <h4 class="my-6">Search Results</h4>

      <v-data-table
        v-model="selectedUser"
        :header-props="{
          class: 'text-body-1 font-weight-bold bg-surface-light',
        }"
        :headers="[
          { title: 'First Name', key: 'ssoUser.firstName', align: 'start' },
          { title: 'Last Name', key: 'ssoUser.lastName', align: 'start' },
          { title: 'Email', key: 'ssoUser.email', align: 'start' },
        ]"
        :items="searchResults || []"
        :loading="loading"
        :sort-by="[{ key: `ssoUser.${searchType}`, order: 'asc' }]"
        select-strategy="single"
        striped="even"
        return-object
        show-select
      >
        <template #no-data>
          <v-alert type="info">No matching users found</v-alert>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>
