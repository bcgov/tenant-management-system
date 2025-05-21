<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

import CreateTenantDialog from '@/components/CreateTenantDialog.vue'
import TenancyList from '@/components/TenancyList.vue'
import { Tenancy } from '@/models/tenancy.model'
import { logError } from '@/plugins/console'
import { getUser } from '@/services/keycloak'
import notificationService from '@/services/notification'
import { useTenanciesStore } from '@/stores/useTenanciesStore'

// Router
const router = useRouter()
const handleCardClick = (id: Tenancy['id']) => {
  router.push(`/tenancies/${id}`)
}

// Tenancies store
const tenanciesStore = useTenanciesStore()
const { tenancies } = storeToRefs(tenanciesStore)

// Dialog visibility state
const dialogVisible = ref(false)
const openDialog = () => (dialogVisible.value = true)
const closeDialog = () => (dialogVisible.value = false)

// Fetch tenancies on load
onMounted(() => {
  tenanciesStore.fetchTenancies(getUser().ssoUserId)
})

// Submit handler
const handleTenancySubmit = async ({
  name,
  ministryName,
}: {
  name: string
  ministryName: string
}) => {
  try {
    const tenancy = new Tenancy(
      uuidv4(),
      name,
      ministryName,
      [getUser()],
    );
    await tenanciesStore.addTenancy(tenancy)

    notificationService.addNotification(
      'New tenancy created successfully',
      'success',
    )

    closeDialog()
  } catch (err) {
    notificationService.addNotification('Failed to create new tenancy', 'error')
    logError('Failed to create new tenancy', err)
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

      <TenancyList :tenancies="tenancies" @select="handleCardClick" />
    </v-container>

    <CreateTenantDialog v-model="dialogVisible" @submit="handleTenancySubmit" />
  </BaseSecure>
</template>
