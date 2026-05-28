<script setup lang="ts">
import { mdiPlus } from '@mdi/js'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { type Service } from '@/models/service.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  isTenantOwner: boolean
  service: Service
}>()

const emit = defineEmits<{
  (event: 'click-add'): void
}>()

// --- Component Methods -------------------------------------------------------

function handleClick() {
  emit('click-add')
}
</script>

<template>
  <v-card color="surface-light-gray">
    <v-card-title>{{ service.displayName }}</v-card-title>
    <v-card-subtitle>{{ service.description }}</v-card-subtitle>
    <v-card-text v-if="isTenantOwner">
      <ButtonPrimary :prepend-icon="mdiPlus" text="Add" @click="handleClick" />
    </v-card-text>
    <v-card-text v-else class="pb-0"></v-card-text>
  </v-card>
</template>
