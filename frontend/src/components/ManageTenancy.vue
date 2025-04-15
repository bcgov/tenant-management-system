<script setup lang="ts">
// Import necessary functions and refs from Vue, Vue Router, and Pinia
import { storeToRefs } from 'pinia'
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchIdirUsers } from '@/services/userService'
import { getTenantRoles, addTenantUsers } from '@/services/tenantService'
import { useTenanciesStore } from '@/stores/tenancies'
import { INJECTION_KEYS } from '@/utils/constants'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'
import type { Role } from '@/types/Role'
import type { User } from '@/types/User'
import notificationService from '@/services/notification'

// Initialize route and router
const route = useRoute()
const router = useRouter()

// Initialize tenancies store and notification service
const tenanciesStore = useTenanciesStore()
const $error = inject(INJECTION_KEYS.error)!
const { tenancies } = storeToRefs(tenanciesStore)

// Computed property to find the current tenancy based on route params
const tenancy = computed(() => tenancies.value.find((t) => t.id === route.params.id))

// Breadcrumbs computed property for navigation
const breadcrumbs = computed(() => [
  { title: 'Tenancies', disabled: false, href: '/tenancies' },
  {
    title: tenancy.value?.name || 'TODO!',
    disabled: false,
    href: `/tenancies/${tenancy.value?.id}`,
  },
])

// Reactive references for form fields and state
const loadingSearchResults = ref(false)
const tab = ref(1)
const roles = ref<Role[]>([])
const searchOption = ref('firstName')
const searchText = ref('')
const searchResults = ref<User[]>([])
const selectedUser = ref<User | null>()
const selectedRole = ref<string | null>()
const deleteDialogVisible = ref(false)

// Function to fetch tenant roles
const fetchTenantRoles = async () => {
  try {
    // TODO: set the route up properly
    const response = await getTenantRoles(route.params.id as string)
    roles.value = response
  } catch (error) {
    $error('Error fetching tenant roles', error)
  }
}

// Function to search users based on search option and text
const searchUsers = async () => {
  if (searchOption.value && searchText.value) {
    try {
      loadingSearchResults.value = true
      const params: IdirSearchParameters = {}
      if (searchOption.value === 'firstName') {
        params.firstName = searchText.value.toLowerCase()
      }
      if (searchOption.value === 'lastName') {
        params.lastName = searchText.value.toLowerCase()
      } else if (searchOption.value === 'email') {
        params.email = searchText.value.toLowerCase()
      }
      searchResults.value = await searchIdirUsers(params)
    } catch (error) {
      $error('Error searching for users', error)
    } finally {
      loadingSearchResults.value = false
    }
  }
}

// Function to add a user to the current tenancy
const addUserToTenancy = async () => {
  if (tenancy.value && selectedUser.value) {
    try {
      const role = roles.value.find((role) => role.name === selectedRole.value)
      const response = await addTenantUsers(
        tenancy.value.id,
        {
          ...selectedUser.value,
        },
        role?.id
      )
      const idx = tenancies.value.findIndex((t) => t.id === route.params.id)
      tenancies.value[idx].users.push({
        ...response.user,
        roles: [response.role],
      })
      notificationService.addNotification('User added to tenancy successfully', 'success')
    } catch (error) {
      $error('Error adding user to tenancy', error)
    } finally {
      searchResults.value = []
      selectedUser.value = null
      selectedRole.value = null
    }
  }
}

// Function to delete the current tenancy
const deleteTenancy = () => {
  tenanciesStore.tenancies = tenanciesStore.tenancies.filter((t) => t.name !== tenancy.value?.name)
  notificationService.addNotification('Tenancy deleted successfully', 'success')
  router.push('/tenancies')
}

// Fetch tenant roles when the component is mounted
onMounted(fetchTenantRoles)
</script>

<template>
  <BaseSecure>
    <!-- Breadcrumbs for navigation -->
    <v-breadcrumbs :items="breadcrumbs" divider=">" color="primary" />

    <!-- Main container for tenancy information -->
    <v-container fluid>
      <v-sheet class="pa-4" width="100%" color="grey-lighten-3">
        <v-row>
          <!-- Tenancy name -->
          <v-col cols="6">
            <h1>{{ tenancy?.name }}</h1>
          </v-col>
          <!-- Edit and Delete options -->
          <v-col cols="6" class="d-flex justify-end">
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon v-bind="props">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item>
                  <v-list-item-title>Edit Tenancy</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteDialogVisible = true">
                  <v-list-item-title>Delete Tenancy</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
        <v-row>
          <!-- BC Ministry name -->
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="tenancy?.ministryName"
              label="BC Ministry"
              readonly
              class="readonly-field"
            ></v-text-field>
          </v-col>
          <!-- Tenant Owner/Admin -->
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="tenancy?.users[0]?.ssoUser?.displayName"
              label="Tenant Owner/Admin"
              readonly
              class="readonly-field"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-sheet>

      <!-- Tabs for different sections -->
      <v-card>
        <v-tabs v-model="tab">
          <v-tab :value="1">Project Information</v-tab>
          <v-tab :value="2">User Management</v-tab>
          <v-tab :value="3">Available Services</v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <!-- Project Information Tab -->
          <v-tabs-window-item :value="1">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for Project Information tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>

          <!-- User Management Tab -->
          <v-tabs-window-item :value="2">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <v-data-table
                    :items="tenancy?.users"
                    item-value="id"
                    :headers="[
                      { title: 'Name', value: 'ssoUser.displayName' },
                      { title: 'Roles', value: 'roles' },
                      { title: 'Email', value: 'ssoUser.email' },
                    ]"
                  >
                    <template #no-data>
                      <v-alert type="info">You have no users in this tenancy.</v-alert>
                    </template>
                    <template #item.roles="{ item }">
                      <v-chip
                        v-for="role in item.roles"
                        :key="role.id"
                        color="primary"
                        class="mr-2"
                      >
                        {{ role.name }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>

              <v-divider></v-divider>

              <v-row class="mt-2">
                <v-col cols="12">
                  <v-data-table
                    v-model="selectedUser"
                    :items="searchResults"
                    item-value="email"
                    :headers="[
                      { title: 'First Name', value: 'firstName' },
                      { title: 'Last Name', value: 'lastName' },
                      { title: 'Email', value: 'email' },
                    ]"
                    :loading="loadingSearchResults"
                    show-select
                    return-object
                    select-strategy="single"
                  >
                    <template #headers="{ columns, isSorted, getSortIcon, toggleSort }">
                      <tr>
                        <template v-for="column in columns" :key="column.key">
                          <th>
                            <span class="mr-2 cursor-pointer" @click="() => toggleSort(column)">{{
                              column.title
                            }}</span>
                            <template v-if="isSorted(column)">
                              <v-icon :icon="getSortIcon(column)"></v-icon>
                            </template>
<!-- TODO
                            <v-icon
                              v-if="column.removable"
                              icon="$close"
                              @click="() => remove(column.key)"
                            ></v-icon>
 -->
</th>
                        </template>
                      </tr>
                    </template>
                    <template #no-data>
                      <v-alert type="info">You have not searched for any users yet</v-alert>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>

              <v-divider></v-divider>

              <v-row v-if="selectedUser">
                <v-col cols="12">
                  <h3>Add a user to this Tenancy</h3>
                  <p>1. Search for a user based on the selection criteria below:</p>
                </v-col>
              </v-row>

              <v-row class="mt-2">
                <v-col cols="12" md="4">
                  <v-select
                    v-model="searchOption"
                    label="Search by name or email"
                    :items="[
                      { title: 'First Name', key: 'firstName' },
                      { title: 'Last Name', key: 'lastName' },
                      { title: 'Email', key: 'email' },
                    ]"
                    item-title="title"
                    item-value="key"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="searchText"
                    label="Enter text here"
                    append-icon="mdi-magnify"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="!searchOption || !searchText"
                    size="x-large"
                    @click="searchUsers"
                    >Search</v-btn
                  >
                </v-col>
              </v-row>

              <v-row v-if="selectedUser">
                <v-col cols="12">
                  <p>2. Assign this user to a role:</p>
                  <v-select
                    v-model="selectedRole"
                    label="Select a role"
                    :items="roles"
                    item-title="description"
                    item-value="name"
                  ></v-select>
                  <v-btn :disabled="!selectedRole" @click="addUserToTenancy">Add User</v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>

          <!-- Available Services Tab -->
          <v-tabs-window-item :value="3">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for Available Services tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-container>

    <!-- Delete Tenancy Dialog -->
    <v-dialog v-model="deleteDialogVisible" persistent dismissable max-width="500px">
      <v-card color="red-lighten-4">
        <v-card-title>
          <v-icon color="red" icon="mdi-alert-circle-outline" size="x-small" />
          Delete this Tenancy?
          <v-icon class="float-right" icon="mdi-close" @click="deleteDialogVisible = false" />
        </v-card-title>
        <v-card-text>
          All users, roles, and permissions related to this tenancy will be permanently deleted.
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="deleteDialogVisible = false">Keep Tenancy</v-btn>
          <v-btn color="red" variant="outlined" @click="deleteTenancy">Delete Tenancy</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </BaseSecure>
</template>
