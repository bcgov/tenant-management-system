<script setup lang="ts">
// --- Component Interface -----------------------------------------------------

defineProps<{
  disabled?: boolean
  text: string
}>()

const emit = defineEmits<{
  (event: 'click'): void
}>()
</script>

<template>
  <v-btn
    :disabled="disabled"
    class="cstar-button-primary"
    color="primary"
    variant="flat"
    @click="emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<style scoped>
.cstar-button-primary:disabled {
  background-color: rgb(var(--v-theme-primary-disabled)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.cstar-button-primary:hover:not(:disabled) {
  background-color: rgb(var(--v-theme-primary-hover)) !important;
}
</style>
