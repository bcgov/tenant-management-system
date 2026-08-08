<script setup lang="ts">
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'

export type DialogButton = {
  action: string
  text: string
  type?: 'primary' | 'secondary'
}

// --- Component Interface -----------------------------------------------------

withDefaults(
  defineProps<{
    buttons?: {
      action: string
      text: string
      type?: 'primary' | 'secondary'
    }[]
    maxWidth?: number
    message: string
    modelValue: boolean
    title: string
  }>(),
  {
    buttons: () => [],
    maxWidth: 500,
  },
)

const emit = defineEmits<{
  (event: 'buttonClick', action: string): void
  (event: 'update:modelValue', value: boolean): void
}>()

// --- Component Methods -------------------------------------------------------

const handleButtonClick = (action: string) => {
  emit('buttonClick', action)
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :max-width="maxWidth ? maxWidth : 500"
    :model-value="modelValue"
    data-testid="dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-item class="pa-6">
        <v-card-title class="text-wrap" data-testid="title">
          <h4 class="ma-0">{{ title }}</h4>
        </v-card-title>
      </v-card-item>
      <v-card-text>
        <div data-testid="message">
          <p class="ma-0">{{ message }}</p>
        </div>
        <div data-testid="slot">
          <slot />
        </div>
      </v-card-text>
      <v-card-actions class="ga-4 justify-end pb-6 pt-0 px-6">
        <component
          :is="btn.type === 'primary' ? ButtonPrimary : ButtonSecondary"
          v-for="btn in buttons"
          :key="btn.action"
          :data-testid="`button-${btn.action}`"
          :text="btn.text"
          @click="handleButtonClick(btn.action)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
