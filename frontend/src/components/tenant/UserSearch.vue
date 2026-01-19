<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import type { User } from '@/models'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'
import type { ItemSlotBase, DataTableItem } from 'vuetify/lib/components/VDataTable/types.mjs';

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  loading?: boolean
  searchResults: User[] | null
  currentUsers: User[] | null
}>()

const emit = defineEmits<{
  (event: 'clear-search'): void
  (event: 'search', searchType: IdirSearchType, searchText: string): void
  (event: 'select', user: User): void
}>()

const colorRowItem = (item: ItemSlotBase<User>) => {
  const index = selectedUser.value.findIndex((u) => u?.id === item?.item?.id)

  if (index > -1) {
    return {
      class: 'selected-user'
    }
  }
  return {}
}

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
const selectedUser = ref<User[]>([])
const conflict = ref(false)
const internalItem = ref<DataTableItem<User>>({} as DataTableItem<User>)

// --- Watchers and Effects ----------------------------------------------------

watch([searchText, searchType], () => {
  emit('clear-search')
})

watch(selectedUser, (selection) => {
  
  if (selection?.length) {
    emit('select', selection[0])
  }
})

type RowPropsType = ItemSlotBase<User>;

const selectUser = (e: Event, r: RowPropsType) => {
  conflict.value = false
  const index = props.currentUsers?.findIndex(
    (u: User) => u.ssoUser.ssoUserId === r.item?.ssoUser.ssoUserId
  )
  if (index !== -1) {
    //remove the user from the selection
    conflict.value = true
    if (internalItem.value) {
      internalItem.value = {} as DataTableItem<User>
      r.toggleSelect(internalItem.value)

    }
    return
  }
  internalItem.value = r.internalItem
  r.toggleSelect(r.internalItem)
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
    <v-dialog
      v-model="conflict"
      width="auto"
    >
      <v-card>
        <v-card-title class="text-h6 border-b-sm">
          <v-icon color="warning" size="xsmall">mdi-alert</v-icon>
          {{ $t('general.duplicate') }}
          <v-icon class="float-right" size="xsmall">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          The selected user is already added to this tenant.
        </v-card-text>
        <v-card-actions class="border-t-sm">
          <v-spacer></v-spacer>
          <ButtonSecondary
            text="OK"
            @click="conflict = false"
          />
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
        :row-props="colorRowItem"
        :sort-by="defaultSort"
        select-strategy="single"
        striped="even"
        return-object
        @dblclick:row="(e: Event, r: RowPropsType) => selectUser(e, r)"
      >
        <template #no-data>
          <v-alert type="info">No matching users found</v-alert>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>

<style>
  .selected-user {
    background-color: #F6FFF8;
    border-color: #42814A;
  }
</style>