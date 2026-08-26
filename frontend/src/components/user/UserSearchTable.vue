<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DataTableHeader } from 'vuetify'

import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { identityProviderToDisplay } from '@/utils/identityProvider'

// --- Component Interface -----------------------------------------------------

defineProps<{
  sortBy: string
  tenant: Tenant
  users: Array<User>
}>()

const emit = defineEmits<{
  'row-clicked': [User | null]
}>()

// --- Component State ---------------------------------------------------------

const headers = [
  { key: 'ssoUser.firstName', title: 'First Name' },
  { key: 'ssoUser.lastName', title: 'Last Name' },
  { key: 'ssoUser.email', title: 'Email' },
  {
    key: 'ssoUser.idpType',
    title: 'Identity Provider',
    sortable: false,
  },
] satisfies DataTableHeader[]

const selectedUser = ref<User[]>([])

// --- Watchers and Effects ----------------------------------------------------

watch(selectedUser, (users) => {
  emit('row-clicked', users[0] ?? null)
})

// --- Component Methods -------------------------------------------------------

// Make it easier on the user by de/selecting the checkbox when the row is
// clicked anywhere.
const onRowClick = (_event: Event, { item }: { item: User }) => {
  const exists = selectedUser.value.some((u) => u.id === item.id)

  selectedUser.value = exists ? [] : [item]
}
</script>

<template>
  <v-data-table
    v-model="selectedUser"
    :header-props="{
      class: 'bg-surface-light-blue font-weight-bold text-body-small',
    }"
    :headers="headers"
    :hide-default-footer="users.length === 0"
    :items="users"
    :sort-by="[{ key: sortBy }]"
    item-value="id"
    select-strategy="single"
    striped="even"
    fixed-header
    hover
    return-object
    show-select
    @click:row="onRowClick"
  >
    <template #no-data>
      <div class="my-8">
        <h5 class="mb-2">No users match your search criteria</h5>

        <p class="mt-0">
          Try adjusting the "Search by" and/or "Search text" fields
        </p>
      </div>
    </template>

    <template #[`item.ssoUser.idpType`]="{ item }">
      {{ identityProviderToDisplay(item.ssoUser.idpType) }}
    </template>
  </v-data-table>
</template>
