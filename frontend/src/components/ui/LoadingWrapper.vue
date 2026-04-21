<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  delay?: number // milliseconds to wait before showing spinner
  loading: boolean
  loadingMessage?: string
}>()

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
      }, props.delay ?? 300)
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
        <v-progress-circular indeterminate />
        <div v-if="loadingMessage" class="mt-2">
          {{ loadingMessage }}
        </div>
      </v-col>
    </v-row>

    <template v-else-if="!loading">
      <slot />
    </template>
  </v-container>
</template>
