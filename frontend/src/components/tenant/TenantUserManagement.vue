<script setup lang="ts">
import { ref } from 'vue'

import { useNotification } from '@/composables'
import UserSearch from '@/components/user/UserSearch.vue'
import type { Role, Tenant, User } from '@/models'
import { useTenantStore } from '@/stores'

const props = defineProps<{
  roles?: Role[]
  tenant?: Tenant
}>()

const tenantStore = useTenantStore()
const { addNotification } = useNotification()

const showSearch = ref(false)
const selectedUser = ref<User | null>(null)
const selectedRole = ref<Role | null>(null)

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    selectedUser.value = null
    selectedRole.value = null
    // userSearchRef.value?.reset()
  }
}

function onUserSelected(user: User) {
  selectedUser.value = user
}

async function addUserToTenant() {
  if (!props.tenant?.id || !selectedUser.value || !selectedRole.value) {
    return
  }

  try {
    await tenantStore.addTenantUser(
      props.tenant.id,
      selectedUser.value,
      selectedRole.value,
    )

    addNotification('User added successfully', 'success')
    toggleSearch()
  } catch (error) {
    addNotification('Failed to add user', 'error')
    console.error(error)
  }
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
            ref="userSearchRef"
            :tenant-id="tenant?.id"
            @select="onUserSelected"
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
                @click="addUserToTenant"
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
