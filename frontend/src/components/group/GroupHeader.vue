<script setup lang="ts">
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { ref } from 'vue'

import type { Group } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

defineProps<{
  group: Group
}>()

const emit = defineEmits<{
  (event: 'update:showDetail', value: boolean): void
}>()

// --- Component State ---------------------------------------------------------

const showDetail = ref(true)

// --- Component Methods -------------------------------------------------------

function toggleDetail() {
  showDetail.value = !showDetail.value
  emit('update:showDetail', showDetail.value)
}
</script>

<template>
  <v-sheet color="surface-light-blue">
    <v-row class="align-center pa-4" no-gutters>
      <v-col cols="8">
        <h2>Group Details</h2>
      </v-col>
      <v-col class="align-center d-flex justify-end" cols="4">
        <div class="me-4">
          <p>
            Date Created:
            <span class="text-no-wrap">
              <strong>{{ group.createdDate }}</strong>
            </span>
          </p>
        </div>
        <div class="me-4">
          <p>
            Created By:
            <strong>{{ group.createdBy }}</strong>
          </p>
        </div>
        <v-btn
          :icon="showDetail ? mdiChevronUp : mdiChevronDown"
          rounded="lg"
          size="small"
          variant="outlined"
          @click="toggleDetail"
        ></v-btn>
      </v-col>
    </v-row>
  </v-sheet>
</template>
