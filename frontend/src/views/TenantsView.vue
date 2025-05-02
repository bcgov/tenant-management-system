<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CreateTenantDialog from '@/components/CreateTenantDialog.vue'
import TenantList from '@/components/TenantList.vue'
import type { Tenant } from '@/models/tenant.model'
import { getUser } from '@/services/keycloak'
import { useTenantStore } from '@/stores/useTenantStore'

// The Vue router to route to different pages.
const router = useRouter()

// Set up any stores that are needed for Components used in this View.
const tenantStore = useTenantStore()
const { tenants } = storeToRefs(tenantStore)

// Route to the tenant details when clicked.
const handleCardClick = (id: Tenant['id']) => {
  router.push(`/tenants/${id}`)
}

// Controls for the Create Tenant Dialog
const dialogVisible = ref(false)
const closeDialog = () => (dialogVisible.value = false)
const openDialog = () => (dialogVisible.value = true)

const fetchTenants = async () => {
  await tenantStore.fetchTenants(getUser().ssoUserId)
}

onMounted(fetchTenants)
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

    <CreateTenantDialog :visible="dialogVisible" @close="closeDialog" />
  </BaseSecure>
</template>
