<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Tenant } from '@/models/tenant.model'

const props = defineProps<{
  tenant?: Tenant
}>()

type EmitFn = (event: 'update:showDetail', value: boolean) => void
const emit = defineEmits<EmitFn>()

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
  <v-sheet width="100%" class="pb-2" color="blue-lighten-5">
    <v-row align="center">
      <v-col cols="6">
        <h1 class="mx-6">Tenant Details</h1>
      </v-col>
      <v-col cols="6" class="d-flex align-center justify-end">
        <div class="me-6">
          Date Created:
          <span class="text-no-wrap">
            <strong>{{ createdDate }}</strong>
          </span>
        </div>
        <div class="me-6">
          Created By:
          <strong>{{ tenant?.createdBy }}</strong>
        </div>
        <v-btn
          icon
          variant="outlined"
          rounded="lg"
          size="small"
          @click="toggleDetail"
          class="mx-4"
        >
          <v-icon>
            {{ showDetail ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-sheet>
</template>
