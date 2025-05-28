<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CreateTenantDialog from '@/components/CreateTenantDialog.vue'
import TenantList from '@/components/TenantList.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors'
import { Tenant } from '@/models/tenant.model'
import { logger } from '@/utils/logger'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'

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

// Dialog visibility state
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => (dialogVisible.value = false)

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
    closeDialog()
  } catch (error: any) {
    if (error instanceof DomainError && error.userMessage) {
      addNotification(error.userMessage, 'error')
    } else {
      addNotification('Failed to create the new tenant', 'error')
      logger.error('Failed to create the new tenant', error)
    }
  }
}
</script>

<template>
  <BaseSecure>
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-plus-box"
            size="large"
            @click="openDialog"
          >
            Create New Tenant
          </v-btn>
        </v-col>
      </v-row>

      <TenantList :tenants="tenants" @select="handleCardClick" />
    </v-container>

    <CreateTenantDialog v-model="dialogVisible" @submit="handleTenantSubmit" />
  </BaseSecure>
</template>
