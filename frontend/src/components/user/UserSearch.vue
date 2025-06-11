<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from '@/models/user.model'
import { useUserStore } from '@/stores/useUserStore'

type EmitFn = (event: 'select', user: User) => void
const emit = defineEmits<EmitFn>()

const props = defineProps<{
  tenantId: string
}>()

const userStore = useUserStore()

// Search state
const searchOption = ref('firstName')
const searchText = ref('')
const selectedUser = ref<User[]>([])

// Constants
const SEARCH_OPTIONS = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
] as const

// Watch for selection changes in the data table
watch(selectedUser, (selection) => {
  if (selection) {
    // Find the full user object from searchResults using the selected ID
    const userId = selection[0].id
    const user = userStore.searchResults.find((user) => user.id === userId)
    if (user) {
      emit('select', user)
    }
  }
})

// Watch for selection changes
watch(selectedUser, (selection) => {
  if (selection && selection.length > 0) {
    emit('select', selection[0])
  }
})

async function search() {
  if (!searchOption.value || !searchText.value) return

  try {
    await userStore.searchIdirUsers({
      [searchOption.value]: searchText.value,
    })
  } catch (error) {
    console.error('Search failed:', error)
  }
}

function reset() {
  searchText.value = ''
  selectedUser.value = []
  searchOption.value = 'firstName'
  userStore.$reset()
}

defineExpose({
  reset,
})
</script>

<template>
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
        :loading="userStore.loading"
        :disabled="!searchText"
        @click="search"
      >
        Search
      </v-btn>
    </v-col>
  </v-row>

  <!-- Results table -->
  <v-row v-if="userStore.searchResults.length || userStore.loading">
    <v-col cols="12">
      <v-data-table
        v-model="selectedUser"
        :items="userStore.searchResults"
        :headers="[
          { title: 'First Name', key: 'firstName', align: 'start' },
          { title: 'Last Name', key: 'lastName', align: 'start' },
          { title: 'Email', key: 'email', align: 'start' },
        ]"
        :loading="userStore.loading"
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
