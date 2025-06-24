<script setup lang="ts">
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  buttons?: {
    text: string
    action: string
    type?: 'primary' | 'secondary'
  }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: string): void
}>()

function onButtonClick(action: string) {
  emit(action) // emits the action name as the event
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title v-if="title" class="text-h6">{{ title }}</v-card-title>
      <v-card-text>
        <div v-if="message">{{ message }}</div>
        <slot />
      </v-card-text>
      <v-card-actions class="justify-end">
        <component
          v-for="btn in buttons"
          :key="btn.action"
          :is="btn.type === 'primary' ? ButtonPrimary : ButtonSecondary"
          :text="btn.text"
          @click="onButtonClick(btn.action)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
