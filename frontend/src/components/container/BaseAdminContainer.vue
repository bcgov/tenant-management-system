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
  <div v-if="isOperationsAdmin">
    <slot></slot>
  </div>

  <SimpleDialog
    v-else
    :buttons="[{ text: 'OK', action: 'ok', type: 'primary' }]"
    :model-value="true"
    message="Click 'OK' to return to the TMS home page."
    title="You are not authorized to view this page"
    @button-click="handleDialogAction"
  />
</template>
