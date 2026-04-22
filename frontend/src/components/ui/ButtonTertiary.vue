<script setup lang="ts">
// --- Component Interface -----------------------------------------------------

defineProps<{
  disabled?: boolean
  icon?: string
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
    class="cstar-button-tertiary"
    data-test-id="button-tertiary"
    variant="text"
    @click="emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<style scoped>
.cstar-button-tertiary:disabled {
  background-color: rgb(var(--v-theme-tertiary-disabled)) !important;
}

.cstar-button-tertiary:hover:not(:disabled) {
  background-color: rgb(var(--v-theme-tertiary-hover)) !important;
}
</style>
