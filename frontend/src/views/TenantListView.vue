<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CreateTenantDialog from '@/components/CreateTenantDialog.vue'
import TenantList from '@/components/TenantList.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import { useNotification } from '@/composables'
import { DomainError, DuplicateEntityError } from '@/errors'
import { Tenant } from '@/models'
import { useAuthStore, useTenantStore } from '@/stores'
import { logger } from '@/utils/logger'

// Router
const router = useRouter()
const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

// User notification creation
const { addNotification } = useNotification()

// Stores
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// Special dialog validation for uniqueness of the name.
const isDuplicateName = ref(false)

// Dialog visibility state
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => {
  dialogVisible.value = false
  isDuplicateName.value = false
}

// Fetch tenants on load
onMounted(async () => {
  try {
    await tenantStore.fetchTenants(authStore.user?.id || '')
  } catch (error) {
    addNotification('Failed to fetch tenants', 'error')
    logger.error('Failed to fetch tenants', error)
  }
})

// Submit handler
const handleTenantSubmit = async ({
  name,
  ministryName,
}: {
  name: string
  ministryName: string
}) => {
  try {
    await tenantStore.addTenant(name, ministryName, authStore.authenticatedUser)
    addNotification('New tenant created successfully', 'success')
    isDuplicateName.value = false
    closeDialog()
  } catch (error: unknown) {
    if (error instanceof DuplicateEntityError) {
      // If the API says that this name exists already, then show the name
      // duplicated validation error.
      isDuplicateName.value = true
    } else if (error instanceof DomainError && error.userMessage) {
      // For any other API Domain Error, display the user message.
      addNotification(error.userMessage, 'error')
    } else {
      // Otherwise display a generic error message.
      addNotification('Failed to create the new tenant', 'error')
      logger.error('Failed to create the new tenant', error)
    }
  }
}
</script>

<template>
  <BaseSecure>
    <!-- Remove the container spacing and let the parent decide that. -->
    <v-container class="ma-0 pa-0" fluid>
      <v-row>
        <v-col cols="12">
          <FloatingActionButton
            icon="mdi-plus-box"
            text="Create New Tenant"
            @click="openDialog"
          />
        </v-col>
      </v-row>

      <TenantList :tenants="tenants" @select="handleCardClick" />
    </v-container>

    <CreateTenantDialog
      v-model="dialogVisible"
      :is-duplicate-name="isDuplicateName"
      @clear-duplicate-error="isDuplicateName = false"
      @submit="handleTenantSubmit"
    />
  </BaseSecure>
</template>
