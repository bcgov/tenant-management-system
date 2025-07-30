<script setup lang="ts">
import { ref } from 'vue'

import type { Group } from '@/models'

// --- Component Interface -----------------------------------------------------

defineProps<{
  group: Group
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'update:showDetail', value: boolean): void // NOSONAR: S6598
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
    <v-row align="center" class="pa-4" no-gutters>
      <v-col cols="8">
        <h2>Group Details</h2>
      </v-col>
      <v-col class="d-flex align-center justify-end" cols="4">
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
          rounded="lg"
          size="small"
          variant="outlined"
          icon
          @click="toggleDetail"
        >
          <v-icon>
            {{ showDetail ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-sheet>
</template>
