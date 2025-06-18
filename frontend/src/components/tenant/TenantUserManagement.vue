<script setup lang="ts">
import { ref, computed } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import UserSearch from '@/components/user/UserSearch.vue'
import type { Role, Tenant, User } from '@/models'

const props = defineProps<{
  loadingSearch: boolean
  possibleRoles?: Role[]
  searchResults: User[]
  tenant?: Tenant
}>()

const emit = defineEmits<{
  (event: 'add', user: User): void
  (event: 'cancel'): void
  (event: 'search', query: Record<string, string>): void
}>()

const showSearch = ref(false)
const selectedUser = ref<User | null>(null)
const selectedRoles = ref<Role[]>([])

const roles = computed(() => props.possibleRoles ?? [])

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    selectedUser.value = null
    selectedRoles.value = []
  }
}

function onUserSelected(user: User) {
  selectedUser.value = user
}

function onSearch(query: Record<string, string>) {
  emit('search', query)
}

function toggleRole(role: Role, checked: boolean) {
  if (checked) {
    if (!selectedRoles.value.find((r) => r.id === role.id)) {
      selectedRoles.value.push(role)
    }
  } else {
    selectedRoles.value = selectedRoles.value.filter((r) => r.id !== role.id)
  }
}

function handleAddUser() {
  if (!selectedUser.value || selectedRoles.value.length === 0) {
    return
  }

  selectedUser.value.roles = [...selectedRoles.value]
  emit('add', selectedUser.value)
  toggleSearch()
}

function handleCancel() {
  emit('cancel')
  toggleSearch()
}
</script>

<template>
  <v-container fluid class="px-0">
    <v-row>
      <v-col cols="12">
        <h2 class="mb-6 mt-12">Tenant Users</h2>
        <v-data-table
          :items="tenant?.users || []"
          item-value="id"
          :headers="[
            { title: 'Name', key: 'displayName', align: 'start' },
            { title: 'TMS Roles', key: 'roles', align: 'start' },
            { title: 'Email', key: 'email', align: 'start' },
          ]"
          hover
          fixed-header
          :sort-by="[{ key: 'displayName', order: 'asc' }]"
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
        >
          <template #no-data>
            <v-alert type="info">You have no users in this tenant.</v-alert>
          </template>
          <template #item.roles="{ item }">
            <v-chip
              v-for="role in item.roles"
              :key="role.id"
              color="primary"
              class="mr-2"
            >
              {{ role.description }}
            </v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-row v-if="!showSearch" class="mt-4">
      <v-col cols="12" class="d-flex justify-start">
        <v-btn
          variant="text"
          color="primary"
          prepend-icon="mdi-plus-box"
          size="large"
          @click="toggleSearch"
          class="pa-2"
        >
          Add user to tenant
        </v-btn>
      </v-col>
    </v-row>

    <v-expand-transition>
      <div v-if="showSearch">
        <v-divider class="my-12" />

        <h2 class="mb-4">Add a user to this Tenant</h2>

        <p class="text-subtitle-1 mb-2 mt-8">
          1. Search for a user based on the selection criteria below:
        </p>

        <template v-if="tenant?.id">
          <UserSearch
            :tenant-id="tenant.id"
            :loading="loadingSearch"
            :results="searchResults"
            @select="onUserSelected"
            @search="onSearch"
          />

          <v-row v-if="selectedUser" class="mt-4">
            <v-col cols="12">
              <p class="text-subtitle-1 mb-2">
                2. Assign role(s) to this user:
              </p>

              <v-checkbox
                v-for="role in roles"
                hide-details
                :key="role.id"
                :label="role.description"
                :model-value="selectedRoles.some((r) => r.id === role.id)"
                @update:model-value="(checked) => toggleRole(role, !!checked)"
                class="my-0 py-0"
              />
            </v-col>
          </v-row>

          <v-row class="mt-8">
            <v-col cols="12" class="d-flex justify-start gap-4">
              <ButtonSecondary text="Cancel" @click="handleCancel" />

              <ButtonPrimary
                v-if="selectedUser"
                text="Add User"
                :disabled="selectedRoles.length === 0"
                @click="handleAddUser"
              />
            </v-col>
          </v-row>
        </template>

        <v-alert
          v-else
          type="warning"
          text="Cannot search users: No tenant selected"
        />
      </div>
    </v-expand-transition>
  </v-container>
</template>
