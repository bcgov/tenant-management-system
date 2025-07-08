<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  loading: boolean
  loadingMessage?: string
  delay?: number // milliseconds to wait before showing spinner
}>()

const showSpinner = ref(false)
let timeoutId: number | null = null

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      // Start the delay timer
      timeoutId = window.setTimeout(() => {
        showSpinner.value = true
      }, props.delay ?? 300) // default 300ms
    } else {
      // Loading finished, hide spinner and clear timeout
      showSpinner.value = false
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<template>
  <v-container>
    <v-row v-if="loading && showSpinner" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate />
        <div v-if="loadingMessage" class="text-center mt-2">
          {{ loadingMessage }}
        </div>
      </v-col>
    </v-row>

    <template v-else-if="!loading">
      <slot />
    </template>
  </v-container>
</template>
