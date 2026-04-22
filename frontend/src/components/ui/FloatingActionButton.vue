<script setup lang="ts">
// --- Component Interface -----------------------------------------------------

defineProps<{
  disabled?: boolean
  icon: string
  text: string
}>()

const emit = defineEmits<{
  (event: 'click'): void
}>()
</script>

<template>
  <v-btn
    :disabled="disabled"
    :prepend-icon="icon"
    class="cstar-floating-action-button px-4 py-2"
    color="primary"
    data-test-id="floating-action-button"
    size="large"
    variant="text"
    @click="emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<style scoped>
.cstar-floating-action-button:hover:not(:disabled) {
  /* Since this button has inverted colour, use the grey background on hover. */
  background-color: rgb(var(--v-theme-secondary-hover)) !important;
}

.cstar-floating-action-button :deep(.v-icon) {
  font-size: 28px;
  height: 28px;
  width: 28px;
}
</style>
