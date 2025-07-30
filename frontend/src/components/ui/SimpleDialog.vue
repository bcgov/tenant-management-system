<script setup lang="ts">
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'

// --- Component Interface -----------------------------------------------------

defineProps<{
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
  (e: 'buttonClick', action: string): void
}>()

// --- Component Methods -------------------------------------------------------

function handleButtonClick(action: string) {
  emit('buttonClick', action)
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
          :is="btn.type === 'primary' ? ButtonPrimary : ButtonSecondary"
          v-for="btn in buttons"
          :key="btn.action"
          :text="btn.text"
          @click="handleButtonClick(btn.action)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
