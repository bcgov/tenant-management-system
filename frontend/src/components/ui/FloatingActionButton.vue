<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  icon: string
  text: string
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'click'): void // NOSONAR: S6598
}>()
</script>

<template>
  <v-btn
    color="primary"
    class="tms-floating-action-button py-2 px-4"
    size="large"
    variant="text"
    :disabled="props.disabled"
    :prepend-icon="props.icon"
    @click="emit('click')"
  >
    {{ props.text }}
  </v-btn>
</template>

<style scoped>
.tms-floating-action-button:hover:not(:disabled) {
  /* Since this button has inverted colour, use the grey background on hover. */
  background-color: rgb(var(--v-theme-secondary-hover)) !important;
}

.tms-floating-action-button :deep(.v-icon) {
  font-size: 28px;
  height: 28px;
  width: 28px;
}
</style>
