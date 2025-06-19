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
  <v-btn
    class="me-4"
    color="secondary"
    variant="outlined"
    :disabled="props.disabled"
    @click="emit('click')"
  >
    {{ props.text }}
  </v-btn>
</template>
