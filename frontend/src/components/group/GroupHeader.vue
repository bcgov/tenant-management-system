<script setup lang="ts">
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'

import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  group: Group
  showDetail: boolean
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'update:showDetail', value: boolean): void
}>()

// --- Component Methods -------------------------------------------------------

function toggleDetail() {
  emit('update:showDetail', !props.showDetail)
}
</script>

<template>
  <v-sheet class="px-10 py-4" color="surface-light-gray" @click="toggleDetail">
    <v-row class="align-center">
      <v-col>
        <hgroup class="text-stack">
          <p class="p-large">{{ group.name }}</p>
          <p class="p-label">Tenant: {{ tenant.name }}</p>
        </hgroup>
      </v-col>

      <v-col cols="auto">
        <v-btn
          :icon="showDetail ? mdiChevronUp : mdiChevronDown"
          rounded="lg"
          size="small"
          variant="plain"
        ></v-btn>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<style scoped>
.text-stack p {
  margin: 0;
}
</style>
