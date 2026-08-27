<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import UserSearchTable from '@/components/user/UserSearchTable.vue'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const { currentUsers, loading, searchResults, tenant } = defineProps<{
  currentUsers: User[] | null
  loading?: boolean
  searchResults: User[] | null
  tenant: Tenant
}>()

const emit = defineEmits<{
  'clear-search': []
  search: [searchType: IdirSearchType, searchText: string]
  select: [user: User | null]
}>()

// --- Component State ---------------------------------------------------------

// Redefine the list of search types so that they're in the order wanted by the
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

const duplicateUser = ref(false)
const searchText = ref('')
const searchType = ref<IdirSearchType>(IDIR_SEARCH_TYPE.FIRST_NAME.value)

// --- Watchers and Effects ----------------------------------------------------

watch([searchText, searchType], () => {
  emit('clear-search')
})

// --- Computed Values ---------------------------------------------------------

// Sort the results by the search type, so that it is updated whenever the user
// changes the search type.
const defaultSort = computed(() => `ssoUser.${searchType.value}`)

// The SSO API will return a 400 if the search text is less than 2 characters.
const isSearchEnabled = computed(() => {
  return searchText.value && searchText.value.length >= 2
})

// --- Component Methods -------------------------------------------------------

const handleRowClicked = (user: User | null) => {
  if (!user) {
    emit('select', null)

    return
  }

  const alreadyAdded = currentUsers?.some(
    (u) => u.ssoUser.ssoUserId === user.ssoUser.ssoUserId,
  )

  if (alreadyAdded) {
    duplicateUser.value = true
    emit('select', null)

    return
  }

  emit('select', user)
}

const handleSearch = () => {
  emit('search', searchType.value, searchText.value)
}
</script>

<template>
  <v-row>
    <v-col cols="4">
      <v-select
        v-model="searchType"
        :items="SEARCH_TYPES"
        label="Search by"
        hide-details
      />
    </v-col>
    <v-col cols="5">
      <v-text-field
        v-model="searchText"
        label="Search text"
        hide-details
        @keyup.enter="handleSearch"
      />
    </v-col>
    <v-col class="d-flex align-center" cols="2">
      <ButtonPrimary
        :disabled="!isSearchEnabled"
        text="Search"
        @click="handleSearch"
      />
    </v-col>
  </v-row>

  <v-row v-if="searchResults !== null || loading">
    <v-col cols="12">
      <h4 class="my-6">Search Results</h4>

      <UserSearchTable
        :loading="loading"
        :sort-by="defaultSort"
        :tenant="tenant"
        :users="searchResults || []"
        @row-clicked="handleRowClicked"
      />
    </v-col>
  </v-row>

  <SimpleDialog
    v-model="duplicateUser"
    :buttons="[{ text: 'OK', action: 'ok', type: 'primary' as const }]"
    message="The selected user is already in this tenant."
    title="User Already Added"
    @button-click="duplicateUser = false"
  />
</template>
