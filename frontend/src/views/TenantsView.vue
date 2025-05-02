<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

import CreateTenantDialog from '@/components/CreateTenantDialog.vue'
import TenantList from '@/components/TenantList.vue'
import type { Tenant } from '@/models/tenant.model'
import { logError } from '@/plugins/console'
import { getUser } from '@/services/keycloak'
import notificationService from '@/services/notification'
import { useTenantStore } from '@/stores/useTenantStore'

// Router
const router = useRouter()
const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

// Tenant store
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// Dialog visibility state
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => (dialogVisible.value = false)

// Fetch tenants on load
onMounted(() => {
  tenantStore.fetchTenants(getUser().ssoUserId)
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
    await tenantStore.addTenant({
      id: uuidv4(),
      name,
      ministryName,
      user: getUser(),
      users: [],
    })

    notificationService.addNotification(
      'New tenancy created successfully',
      'success',
    )

    closeDialog()
  } catch (err) {
    notificationService.addNotification('Failed to create new tenant', 'error')
    logError('Failed to create new tenant', err)
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
