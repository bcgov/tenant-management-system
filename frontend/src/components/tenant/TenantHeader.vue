<script setup lang="ts">
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { ref } from 'vue'

import { type Tenant } from '@/models/tenant.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'update:showDetail', value: boolean): void
}>()

// --- Component State ---------------------------------------------------------

const showDetail = ref(false)

// --- Component Methods -------------------------------------------------------

function toggleDetail() {
  showDetail.value = !showDetail.value
  emit('update:showDetail', showDetail.value)
}
</script>

<template>
  <v-sheet class="px-10 py-4" color="surface-light-gray" @click="toggleDetail">
    <v-row class="align-center">
      <v-col>
        <hgroup class="text-stack">
          <p class="p-large">{{ tenant.name }}</p>
          <p class="p-label">{{ tenant.ministryName }}</p>
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
