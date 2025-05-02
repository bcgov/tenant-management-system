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

// Routing for switching to other views.
const router = useRouter()
const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

// State storage.
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// TODO: was there a spinner before?
const fetchTenants = async () => {
  await tenantStore.fetchTenants(getUser().ssoUserId)
}

// Use a handler for submitting new tenant to the backend.
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
  } catch (err) {
    notificationService.addNotification('Failed to create new tenancy', 'error')
    logError('Failed to create new tenancy', err)
  } finally {
    closeDialog()
  }
}

onMounted(fetchTenants)

// Dialog controls
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => (dialogVisible.value = false)
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

    <CreateTenantDialog
      :visible="dialogVisible"
      @close="closeDialog"
      @submit="handleTenantSubmit"
    />
  </BaseSecure>
</template>
