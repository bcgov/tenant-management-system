<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Tenant } from '@/models'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant?: Tenant
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

// --- Computed Values ---------------------------------------------------------

const createdDate = computed(() => {
  if (!props.tenant?.createdDate) {
    return ''
  }

  return props.tenant.createdDate
})

// --- Component Methods -------------------------------------------------------

function toggleDetail() {
  showDetail.value = !showDetail.value
  emit('update:showDetail', showDetail.value)
}
</script>

<template>
  <v-sheet color="surface-light-blue">
    <v-row align="center" class="pa-4" no-gutters>
      <v-col cols="12" sm="6">
        <h2>Tenant Details</h2>
      </v-col>
      <v-col class="d-flex align-center justify-end" cols="12" sm="6">
        <div class="me-4">
          <p>
            Date Created:
            <span class="text-no-wrap">
              <strong>{{ createdDate }}</strong>
            </span>
          </p>
        </div>
        <div class="me-4">
          <p>
            Created By:
            <strong>{{ tenant?.createdBy }}</strong>
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
