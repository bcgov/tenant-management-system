<script setup lang="ts">
import { mdiAlert, mdiClose } from '@mdi/js'
import { computed, ref, watch } from 'vue'
// TODO: sus
import type {
  ItemSlotBase,
  DataTableItem,
} from 'vuetify/lib/components/VDataTable/types.mjs'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import UserTable from '@/components/user/UserTable.vue'
import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  loading?: boolean
  searchResults: User[] | null
  currentUsers: User[] | null
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'clear-search'): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
  (event: 'select', user: User | null): void
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

const searchText = ref('')
const searchType = ref<IdirSearchType>(IDIR_SEARCH_TYPE.FIRST_NAME.value)
const conflict = ref(false)
const internalItem = ref<DataTableItem<User>>({} as DataTableItem<User>)

// --- Watchers and Effects ----------------------------------------------------

watch([searchText, searchType], () => {
  emit('clear-search')
})

type RowPropsType = ItemSlotBase<User>

const selectUser = (e: Event | null, r: RowPropsType) => {
  conflict.value = false
  const index = props.currentUsers?.findIndex(
    (u: User) => u.ssoUser.ssoUserId === r.item?.ssoUser.ssoUserId,
  )
  if (index !== -1) {
    //remove the user from the selection
    conflict.value = true
    if (internalItem.value) {
      internalItem.value = {} as DataTableItem<User>
      r.toggleSelect(internalItem.value)
    }
    emit('select', null)
    return false
  }
  internalItem.value = r.internalItem
  emit('select', r.internalItem.value)
  return true
}

// --- Computed Values ---------------------------------------------------------

// Sort the results by the search type, so that it is updated whenever the user
// changes the search type.
const defaultSort = computed(() => [{ key: `ssoUser.${searchType.value}` }])

// The SSO API will return a 400 if the search text is less than 2 characters.
const isSearchEnabled = computed(() => {
  return searchText.value && searchText.value.length >= 2
})

// --- Component Methods -------------------------------------------------------

function handleSearch() {
  emit('search', searchType.value, searchText.value)
}
</script>

<template>
  <v-row>
    <v-dialog v-model="conflict" width="auto">
      <v-card>
        <v-card-title class="text-h6 border-b-sm">
          <v-icon :icon="mdiAlert" color="warning" size="xsmall" />
          {{ $t('general.duplicate') }}
          <v-icon :icon="mdiClose" class="float-right" size="xsmall" />
        </v-card-title>
        <v-card-text>
          The selected user is already added to this tenant.
        </v-card-text>
        <v-card-actions class="border-t-sm">
          <v-spacer></v-spacer>
          <ButtonSecondary text="OK" @click="conflict = false" />
        </v-card-actions>
      </v-card>
    </v-dialog>
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

      <UserTable
        :enable-select="true"
        :select-user="selectUser"
        :show-add="true"
        :sort-by="defaultSort"
        :tenant="tenant"
        :users="searchResults || []"
        where="tenant"
      />
    </v-col>
  </v-row>
</template>

<style>
.selected-user {
  background-color: #f6fff8;
  border-color: #42814a;
}
</style>
