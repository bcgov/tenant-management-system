<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import TenantDetails from '@/components/tenant/TenantDetails.vue'
import TenantHeader from '@/components/tenant/TenantHeader.vue'
import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import BreadcrumbBar from '@/components/ui/BreadcrumbBar.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { Tenant, User } from '@/models'
import { useRoleStore, useTenantStore, useUserStore } from '@/stores'
import { logger } from '@/utils/logger'

const route = useRoute()

const roleStore = useRoleStore()
const tenantStore = useTenantStore()
const userStore = useUserStore()

const tenant = ref<Tenant | undefined>()

onMounted(async () => {
  await roleStore.fetchRoles()
})

onMounted(async () => {
  await roleStore.fetchRoles()

  const tenantId = route.params.id as string
  if (tenantId) {
    tenant.value = await tenantStore.fetchTenant(tenantId)
  }
})

// UI state
const showDetail = ref(true)
const deleteDialogVisible = ref(false)
const isEditing = ref(false)
const tab = ref<number>(0)

const breadcrumbs = computed(() => [
  { title: 'Tenants', disabled: false, href: '/tenants' },
  {
    title: tenant.value?.name || '',
    disabled: false,
    href: `/tenants/${tenant.value?.id}`,
  },
])

const roles = computed(() => roleStore.roles)
const { addNotification } = useNotification()

const searchResults = ref<User[]>([])
const loadingSearch = ref(false)

async function handleSearch(query: Record<string, string>) {
  loadingSearch.value = true
  try {
    searchResults.value = await userStore.searchIdirUsers(query)
  } catch (error) {
    logger.error('User search failed', error)
    addNotification('User search failed', 'error')
    searchResults.value = []
  } finally {
    loadingSearch.value = false
  }
}

async function handleUpdate(updatedTenant: Partial<Tenant>) {
  try {
    await tenantStore.updateTenant({
      ...tenant.value,
      ...updatedTenant,
    })
    isEditing.value = false
  } catch (error) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      // isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message.
      addNotification(error.userMessage, 'error')
    } else {
      // Otherwise display a generic error message.
      addNotification('Failed to udpate the tenant', 'error')
      logger.error('Failed to update the tenant', error)
    }
  }
}

async function handleAddUser(user: User) {
  try {
    if (tenant.value) {
      await tenantStore.addTenantUser(tenant.value, user)
      addNotification('User added successfully')
    }
  } catch (error) {
    logger.error('Failed to add user', error)
    if (error instanceof DuplicateEntityError) {
      addNotification(
        `Cannot add user "${user.displayName}": already a user in this tenant`,
        'error',
      )
    } else {
      addNotification('Failed to add user', 'error')
    }

    searchResults.value = []
  }
}
</script>

<template>
  <BaseSecure>
    <v-container fluid class="px-4">
      <BreadcrumbBar :items="breadcrumbs" class="mb-6" />

      <TenantHeader :tenant="tenant" v-model:show-detail="showDetail" />

      <TenantDetails
        v-if="showDetail"
        :tenant="tenant"
        v-model:delete-dialog="deleteDialogVisible"
        v-model:is-editing="isEditing"
        @update="handleUpdate"
      />

      <!-- Inlined Tabs -->
      <v-card elevation="0" class="mt-6">
        <v-tabs v-model="tab" :mandatory="false" :disabled="isEditing">
          <v-tab :value="0" class="pa-0 ma-0" style="min-width: 0px" />
          <v-tab :value="1">User Management</v-tab>
          <v-tab :value="2">Available Services</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0" />

          <v-window-item :value="1">
            <TenantUserManagement
              :possible-roles="roles"
              :tenant="tenant"
              :search-results="searchResults"
              :loading-search="loadingSearch"
              @add="handleAddUser"
              @cancel="searchResults = []"
              @search="handleSearch"
            />
          </v-window-item>

          <v-window-item :value="2">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for Available Services tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card>
    </v-container>
  </BaseSecure>
</template>
