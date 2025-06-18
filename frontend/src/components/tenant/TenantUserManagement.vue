<script setup lang="ts">
import { ref, computed } from 'vue'

import UserSearch from '@/components/user/UserSearch.vue'
import type { Role, Tenant, User } from '@/models'

const props = defineProps<{
  loadingSearch: boolean
  possibleRoles?: Role[]
  searchResults: User[]
  tenant?: Tenant
}>()

const emit = defineEmits<{
  (event: 'add', payload: { user: User; role: Role }): void
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
  if (!selectedUser.value || selectedRoles.value.length === 0) return

  for (const role of selectedRoles.value) {
    emit('add', { user: selectedUser.value, role })
  }

  toggleSearch()
}
</script>

<template>
  <v-container fluid class="px-0">
    <v-row>
      <v-col cols="12">
        <v-data-table
          :items="tenant?.users || []"
          item-value="id"
          :headers="[
            { title: 'Name', key: 'displayName', align: 'start' },
            { title: 'Roles', key: 'roles', align: 'start' },
            { title: 'Email', key: 'email', align: 'start' },
          ]"
          hover
          fixed-header
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

    <v-row class="mt-4">
      <v-col cols="12">
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
        <v-divider class="my-4" />
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
              <p class="text-subtitle-1 mb-2">Assign Role(s):</p>

              <v-checkbox
                v-for="role in roles"
                :key="role.id"
                :label="role.description"
                :model-value="selectedRoles.some((r) => r.id === role.id)"
                @update:model-value="(checked) => toggleRole(role, !!checked)"
                class="mb-1"
              />

              <v-btn
                color="primary"
                :disabled="selectedRoles.length === 0"
                @click="handleAddUser"
                class="mt-4"
              >
                Add User to Tenant
              </v-btn>
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
