<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import TenantList from '@/components/TenantList.vue'
import CreateTenancyDialog from '@/components/CreateTenancyDialog.vue'
import { useTenantStore } from '@/stores/tenants'
import { INJECTION_KEYS } from '@/utils/constants'
import { getUser } from '@/services/keycloak'

const router = useRouter()
const tenantsStore = useTenantStore()
const { tenants } = storeToRefs(tenantsStore)
const $error = inject(INJECTION_KEYS.error)!
const dialogVisible = ref(false)

const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => (dialogVisible.value = false)

const fetchTenants = async () => {
  try {
    console.log('user', getUser())
    await tenantsStore.fetchTenants(getUser().ssoUserId)
  } catch (err) {
    $error('Error fetching user tenants', err)
  }
}

const handleCardClick = (id: string) => {
  router.push(`/tenants/${id}`)
}

onMounted(fetchTenants)
</script>

<template>
  <BaseSecure>
    <v-container class="mt-4">
      <v-row>
        <v-col cols="12">
          <v-btn variant="text" color="primary" prepend-icon="mdi-plus-box" @click="openDialog">
            Create New Tenant
          </v-btn>
        </v-col>
      </v-row>

      <TenantList :tenants="tenants" @select="handleCardClick" />
    </v-container>

    <CreateTenancyDialog :visible="dialogVisible" @close="closeDialog" />
  </BaseSecure>
</template>
