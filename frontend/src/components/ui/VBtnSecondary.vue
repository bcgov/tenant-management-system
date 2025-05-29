<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  text: string
}>()

type Emit = (e: 'click') => void
const emit = defineEmits<Emit>()
</script>

<template>
  <v-btn
    color="secondary"
    variant="flat"
    :disabled="props.disabled"
    @click="emit('click')"
  >
    {{ props.text }}
  </v-btn>
</template>
