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
const selectedUser = ref<User | null>(null)

// Constants
const SEARCH_OPTIONS = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
] as const

// Watch for selection changes
watch(selectedUser, (user) => {
  if (user) {
    emit('select', user)
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
  selectedUser.value = null
  searchOption.value = 'firstName'
  userStore.$reset()
}

defineExpose({
  reset,
})
</script>

<template>
  <div>
    <!-- Search controls -->
    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="searchOption"
          label="Search by"
          :items="SEARCH_OPTIONS"
        />
      </v-col>
      <v-col cols="12" md="8" class="d-flex gap-4">
        <v-text-field
          v-model="searchText"
          label="Search text"
          class="flex-grow-1"
          @keyup.enter="search"
        />
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
          show-select
          single-select
          item-value="id"
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
  </div>
</template>
