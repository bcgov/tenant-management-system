<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
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
  <!--
    Use a flat button even though the desired style is outlined. In theory flat
    buttons do less "fancy" stuff and makes it easier to control colours, etc.
  -->
  <v-btn
    :disabled="props.disabled"
    base-color="secondary"
    border="sm opacity-100"
    class="tms-button-secondary"
    variant="flat"
    @click="emit('click')"
  >
    {{ props.text }}
  </v-btn>
</template>

<style scoped>
.tms-button-secondary:disabled {
  background-color: rgb(var(--v-theme-secondary-disabled)) !important;
}

.tms-button-secondary:hover:not(:disabled) {
  background-color: rgb(var(--v-theme-secondary-hover)) !important;
}
</style>
