<script setup lang="ts">
// Import necessary functions and refs from Vue, Vue Router, and Pinia
import { storeToRefs } from 'pinia'
import { ref, computed /*, inject, onMounted*/ } from 'vue'
import { useRoute /*, useRouter*/ } from 'vue-router'
import { useTenantStore } from '@/stores/useTenantStore'

// Initialize route and router
const route = useRoute()
// const router = useRouter()

// Initialize tenant store and notification service
const tenantStore = useTenantStore()
// const $error = inject('$error')
// const notificationService = inject('notificationService')
const { tenants } = storeToRefs(tenantStore)

// Computed property to find the current tenancy based on route params
const tenancy = computed(() =>
  tenants.value.find((t) => t.id === route.params.id),
)

// Breadcrumbs computed property for navigation
const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenancies' },
  {
    title: tenancy.value?.name || '',
    disabled: false,
    href: `/tenancies/${tenancy.value?.id}`,
  },
])

// Reactive references for form fields and state
const loadingSearchResults = ref(false)
const tab = ref(1)
const roles = ref([])
const searchOption = ref('firstName')
const searchText = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const selectedRole = ref('')
const deleteDialogVisible = ref(false)

// Function to fetch tenant roles (using store's method)
// const fetchTenantRoles = async () => {
//   await tenantStore.fetchTenantUserRoles(route.params.id, selectedUser.value.id)
//   roles.value =
//     tenantStore.tenantUserRoles[route.params.id]?.[selectedUser.value.id] || []
// }

// Function to search users based on search option and text (using store's method)
// const searchUsers = async () => {
//   if (searchOption.value && searchText.value) {
//     try {
//       loadingSearchResults.value = true
//       await tenantStore.fetchTenantUsers(route.params.id)
//       const users = tenantStore.tenantUsers[route.params.id] || []

//       searchResults.value = users
//         .filter((user) => {
//           const userField = user[searchOption.value]
//           return (
//             userField &&
//             userField.toLowerCase().includes(searchText.value.toLowerCase())
//           )
//         })
//         .map((user) => ({
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           ssoUserId: user.ssoUserId,
//         }))
//     } catch (error) {
//       $error(error)
//     } finally {
//       loadingSearchResults.value = false
//     }
//   }
// }

// Function to add a user to the current tenancy
// const addUserToTenancy = async () => {
//   if (tenancy.value && selectedUser.value) {
//     try {
//       const response = await tenantStore.addTenantUserToTenancy(
//         tenancy.value.id,
//         selectedUser.value,
//         selectedRole.value,
//       )
//       notificationService.addNotification(
//         'User added to tenancy successfully',
//         'success',
//       )
//     } catch (error) {
//       $error(error)
//     } finally {
//       searchResults.value = []
//       selectedUser.value = null
//       selectedRole.value = ''
//     }
//   }
// }

// Function to delete the current tenancy
// const deleteTenancy = async () => {
//   try {
//     await tenantStore.deleteTenancy(tenancy.value.id)
//     notificationService.addNotification(
//       'Tenancy deleted successfully',
//       'success',
//     )
//     router.push('/tenancies')
//   } catch (error) {
//     $error(error)
//   }
// }

// // Fetch tenants when the component is mounted
// onMounted(() => {
//   tenantStore.fetchTenants(route.params.userId)
// })
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
          <!-- Tenant Owner -->
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="tenancy?.users[0]?.displayName"
              label="Tenant Owner"
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
          <!--
          <v-tabs-window-item :value="2">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <v-data-table
                    :items="tenancy.users"
                    item-value="id"
                    :headers="[
                      { title: 'Name', value: 'ssoUser.displayName' },
                      { title: 'Roles', value: 'roles' },
                      { title: 'Email', value: 'ssoUser.email' },
                    ]"
                  >
                    <template #no-data>
                      <v-alert type="info"
                        >You have no users in this tenancy.</v-alert
                      >
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
                    <template #no-data>
                      <v-alert type="info"
                        >You have not searched for any users yet</v-alert
                      >
                    </template>
                  </v-data-table>
                </v-col>
              </v-row></v-container
            ></v-tabs-window-item
          >--></v-tabs-window
        ></v-card
      ></v-container
    ></BaseSecure
  >
</template>
