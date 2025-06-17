<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Tenant } from '@/models'

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

const showDetail = ref(true)

function toggleDetail() {
  showDetail.value = !showDetail.value
  emit('update:showDetail', showDetail.value)
}

const createdDate = computed(() => {
  if (!props.tenant?.createdDate) {
    return ''
  }

  return props.tenant.createdDate
})
</script>

<template>
  <v-sheet class="bg-blue-lighten-5">
    <v-row align="center" class="pa-4" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Tenant Details</h1>
      </v-col>
      <v-col cols="12" sm="6" class="d-flex align-center justify-end">
        <div class="me-4">
          Date Created:
          <span class="text-no-wrap">
            <strong>{{ createdDate }}</strong>
          </span>
        </div>
        <div class="me-4">
          Created By:
          <strong>{{ tenant?.createdBy }}</strong>
        </div>
        <v-btn
          icon
          variant="outlined"
          rounded="lg"
          size="small"
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
