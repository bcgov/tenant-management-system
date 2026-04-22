<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

// --- Component Interface -----------------------------------------------------

const props = withDefaults(
  defineProps<{
    delayMilliseconds?: number
    loading: boolean
    loadingMessage?: string
  }>(),
  {
    delayMilliseconds: 300,
    loadingMessage: undefined,
  },
)

// --- Component State ---------------------------------------------------------

const showSpinner = ref(false)
let timeout: ReturnType<typeof globalThis.setTimeout> | null = null

// --- Watchers and Effects ----------------------------------------------------

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      timeout = globalThis.setTimeout(() => {
        showSpinner.value = true
      }, props.delayMilliseconds)
    } else {
      showSpinner.value = false
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
    }
  },
  { immediate: true },
)

// --- Component Lifecycle -----------------------------------------------------

onBeforeUnmount(() => {
  if (timeout) {
    clearTimeout(timeout)
  }
})
</script>

<template>
  <v-container>
    <v-row v-if="loading && showSpinner" class="align-center justify-center">
      <v-col class="text-center" cols="auto">
        <v-progress-circular data-test-id="spinner" indeterminate />
        <div v-if="loadingMessage" class="mt-2" data-test-id="message">
          {{ loadingMessage }}
        </div>
      </v-col>
    </v-row>

    <template v-else-if="!loading">
      <div data-test-id="content">
        <slot />
      </div>
    </template>
  </v-container>
</template>
