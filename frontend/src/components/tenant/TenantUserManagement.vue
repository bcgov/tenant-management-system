<script setup lang="ts">
import { ref } from 'vue'
import UserSearch from '@/components/user/UserSearch.vue'
import type { Role, Tenant, User } from '@/models'

const props = defineProps<{
  roles?: Role[]
  tenant?: Tenant
  searchResults: User[]
  loadingSearch: boolean
}>()

const emit = defineEmits<{
  (event: 'add', payload: { user: User; role: Role }): void
  (event: 'search', query: Record<string, string>): void
}>()

const showSearch = ref(false)
const selectedUser = ref<User | null>(null)
const selectedRole = ref<Role | null>(null)

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    selectedUser.value = null
    selectedRole.value = null
  }
}

function onUserSelected(user: User) {
  selectedUser.value = user
}

function onSearch(query: Record<string, string>) {
  emit('search', query)
}

function handleAddUser() {
  if (!selectedUser.value || !selectedRole.value) {
    return
  }

  emit('add', {
    user: selectedUser.value,
    role: selectedRole.value,
  })

  toggleSearch()
}
</script>

<template>
  <v-container fluid class="px-0">
    <!-- Existing users table -->
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

    <!-- Add user button -->
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

    <!-- Search section -->
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

          <!-- Role selection -->
          <v-row v-if="selectedUser" class="mt-4">
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedRole"
                label="Select Role"
                :items="roles"
                item-title="description"
                return-object
                hide-details
                required
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-btn
                color="primary"
                :disabled="!selectedRole"
                @click="handleAddUser"
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
