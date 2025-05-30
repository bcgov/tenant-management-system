<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'
import { ref } from 'vue'

const props = defineProps<{
  tenant?: Tenant
}>()

type EmitFn = {
  (event: 'update:showDetail', value: boolean): void
}
const emit = defineEmits<EmitFn>()

const showDetail = ref(true)

function toggleDetail() {
  showDetail.value = !showDetail.value
  emit('update:showDetail', showDetail.value)
}
</script>

<template>
  <v-sheet class="pa-4" width="100%" color="grey-lighten-3">
    <v-row>
      <v-col cols="6">
        <h1>Tenant Details</h1>
      </v-col>
      <v-col cols="3">
        Date Created: <strong>{{ tenant?.createdDateTime }}</strong>
      </v-col>
      <v-col cols="2">
        Created By: <strong>{{ tenant?.createdBy }}</strong>
      </v-col>
      <v-col cols="1" class="d-flex justify-end">
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
