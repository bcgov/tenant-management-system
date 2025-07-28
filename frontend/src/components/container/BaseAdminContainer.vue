<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import SimpleDialog from '@/components/ui/SimpleDialog.vue'
import { currentUserIsOperationsAdmin } from '@/utils/permissions'

const router = useRouter()

const isOperationsAdmin = computed(() => currentUserIsOperationsAdmin())

function handleDialogAction(action: string) {
  if (action === 'ok') {
    router.push('/tenants')
  }
}
</script>

<template>
  <!-- Show content if ops admin -->
  <div v-if="isOperationsAdmin">
    <slot></slot>
  </div>

  <!-- Show SimpleDialog if not ops admin -->
  <SimpleDialog
    v-else
    :model-value="true"
    title="You are not authorized to view this page"
    message="Click 'OK' to return to the TMS home page."
    :buttons="[{ text: 'OK', action: 'ok', type: 'primary' }]"
    @button-click="handleDialogAction"
  />
</template>
