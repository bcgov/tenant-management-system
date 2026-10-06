<script setup lang="ts">
import { computed } from 'vue'

import { useNotification } from '@/composables/useNotification'

const { messages, dismiss } = useNotification()

const current = computed(() => messages.value[0])
</script>

<template>
  <v-snackbar
    v-if="current"
    :key="current.id"
    :color="current.color"
    :model-value="true"
    :timeout="6000"
    class="cursor-pointer"
    role="alert"
    @click="dismiss"
    @update:model-value="dismiss"
  >
    <div class="align-center d-flex flex-row">
      <v-icon :icon="`$${current.color}`" class="flex-shrink-0 mr-4" />
      <div>{{ current.text }}</div>
    </div>
  </v-snackbar>
</template>
