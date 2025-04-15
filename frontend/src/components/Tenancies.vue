<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'

import CreateTenancyDialog from '@/components/CreateTenancyDialog.vue'
import { getTenantUsers, getTenantUserRoles } from '@/services/tenantService'
import { getUserTenants } from '@/services/userService'
import { useTenanciesStore } from '@/stores/tenancies'
import { INJECTION_KEYS, ROLES } from '@/utils/constants'

// Initialize tenancies store and router
const tenanciesStore = useTenanciesStore()
const $error = inject(INJECTION_KEYS.error)!
const router = useRouter()

// Reactive references for dialog visibility and tenancies
const dialogVisible = ref(false)
const { tenancies } = storeToRefs(tenanciesStore)

// Function to open the Create Tenancy dialog
const openDialog = () => {
  dialogVisible.value = true
}

// Function to close the Create Tenancy dialog
const closeDialog = () => {
  dialogVisible.value = false
}

// Function to navigate to the Manage Tenancy view
const goToManageTenancy = (id: string) => {
  router.push({ path: `/tenancies/${id}` })
}

// Computed property to find the first admin user in the tenancies
const firstAdminUser = computed(() => {
  return (
    tenancies.value
      ?.flatMap((tenancy) => tenancy.users)
      ?.find((user) => user.roles.some((role) => role.name === ROLES.ADMIN)) || null
  )
})

// Function to fetch user tenants and their details
const fetchUserTenants = async () => {
  try {
    let tcies = []
    const data = await getUserTenants()
    for (const tcy of data.data.tenants) {
      let tenancy = tcy
      tenancy.users = []
      const tenancyUsers = await getTenantUsers(tcy.id)
      for (const tcyUser of tenancyUsers) {
        let tenancyUser = tcyUser
        const userRoles = await getTenantUserRoles(tcy.id, tcyUser.id)
        tenancyUser.roles = userRoles
        tenancy.users.push(tenancyUser)
      }
      tcies.push(tenancy)
    }
    tenancies.value = tcies
  } catch (error) {
    $error('Error fetching user tenants', error)
  }
}

// Fetch user tenants when the component is created
fetchUserTenants()
</script>

<template>
  <BaseSecure>
    <!-- Container for the main content -->
    <v-container class="mt-4">
      <!-- Row for the Create New Tenancy button -->
      <v-row>
        <v-col cols="12">
          <v-btn variant="text" color="primary" prepend-icon="mdi-plus-box" @click="openDialog">
            <template #prepend>
              <v-icon color="primary" size="x-large"></v-icon>
            </template>
            Create New Tenancy
          </v-btn>
        </v-col>
      </v-row>
      <!-- Row for displaying the tenancies -->
      <v-row>
        <v-col v-for="tenancy in tenancies" :key="tenancy.id" cols="12" md="4">
          <v-card @click="goToManageTenancy(tenancy.id)">
            <v-card-title>{{ tenancy.name }}</v-card-title>
            <v-card-subtitle>{{ tenancy.ministryName }}</v-card-subtitle>
            <v-card-text v-if="firstAdminUser != null">
              <p>Tenant Owner/Admin: {{ firstAdminUser.ssoUser.displayName }}</p>
              <p>{{ firstAdminUser.ssoUser.email }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <!-- Create Tenancy Dialog component -->
    <CreateTenancyDialog :visible="dialogVisible" @close="closeDialog" />
  </BaseSecure>
</template>
