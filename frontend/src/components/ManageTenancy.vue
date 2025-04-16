<script setup lang="ts">
/*
// Import necessary functions and refs from Vue, Vue Router, and Pinia
import { storeToRefs } from 'pinia'
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchIdirUsers } from '@/services/userService'
import { getTenantRoles, addTenantUsers } from '@/services/tenantService'
import { useTenanciesStore } from '@/stores/tenants'
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
*/
</script>

<template>
  <BaseSecure>
  </BaseSecure>
</template>
