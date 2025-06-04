<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  text: string
}>()

type EmitFn = (e: 'click') => void
const emit = defineEmits<EmitFn>()
</script>

<template>
  <v-btn
    class="me-4"
    color="primary"
    variant="flat"
    :disabled="props.disabled"
    @click="emit('click')"
  >
    {{ props.text }}
  </v-btn>
</template>
