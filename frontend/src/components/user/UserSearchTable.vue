<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableHeader } from 'vuetify'

import { type Tenant } from '@/models/tenant.model'
import { type User } from '@/models/user.model'
import { identityProviderToDisplay } from '@/utils/identityProvider'

// --- Component Interface -----------------------------------------------------

defineProps<{
  sortBy: string
  tenant: Tenant
  users: Array<User>
  where: 'group' | 'tenant'
}>()

const emit = defineEmits<{
  (event: 'row-clicked', user: User | null): void
}>()

// --- Component State ---------------------------------------------------------

const { t } = useI18n()

const headerClass = 'bg-surface-light-blue font-weight-bold text-body-small'

const headers = [
  { key: 'ssoUser.firstName', title: t('users.firstName') },
  { key: 'ssoUser.lastName', title: t('users.lastName') },
  { key: 'ssoUser.email', title: t('users.email') },
  {
    key: 'ssoUser.idpType',
    title: t('users.idpType'),
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
      class: headerClass,
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
        <h5 class="mb-2">
          {{ $t('users.noMatch') }}
        </h5>

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
