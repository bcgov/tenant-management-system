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
  <!--
    Use a flat button even though the desired style is outlined. In theory flat
    buttons do less "fancy" stuff and makes it easier to control colours, etc.
  -->
  <v-btn
    :disabled="disabled"
    base-color="secondary"
    border="opacity-100 sm"
    class="cstar-button-secondary"
    data-test-id="button-secondary"
    variant="flat"
    @click="emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<style scoped>
.cstar-button-secondary:disabled {
  background-color: rgb(var(--v-theme-secondary-disabled)) !important;
}

.cstar-button-secondary:hover:not(:disabled) {
  background-color: rgb(var(--v-theme-secondary-hover)) !important;
}
</style>
