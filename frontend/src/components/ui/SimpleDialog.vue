<script setup lang="ts">
import {
  mdiAlertOctagonOutline,
  mdiAlertOutline,
  mdiCheckCircleOutline,
  mdiClose,
} from '@mdi/js'
import { computed } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'

export type DialogButton = {
  action: string
  text: string
  type?: 'primary' | 'secondary'
}

// --- Component Interface -----------------------------------------------------

const props = withDefaults(
  defineProps<{
    buttons?: {
      action: string
      text: string
      type?: 'primary' | 'secondary'
    }[]
    dialogType?: string | null
    hasClose?: boolean
    maxWidth?: number
    message: string
    modelValue: boolean
    title: string
  }>(),
  {
    buttons: () => [],
    dialogType: null,
    hasClose: true,
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

// --- Computed Values ---------------------------------------------------------

const iconType = computed(() => {
  switch (props.dialogType) {
    case 'error':
      return mdiAlertOctagonOutline
    case 'success':
      return mdiCheckCircleOutline
    case 'warning':
      return mdiAlertOutline
    default:
      return ''
  }
})
</script>

<template>
  <v-dialog
    :max-width="maxWidth ? maxWidth : 500"
    :model-value="modelValue"
    data-testid="dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-item>
        <template v-if="dialogType !== null" #prepend>
          <v-icon
            v-if="dialogType !== null"
            :color="dialogType"
            :icon="iconType"
            data-testid="icon"
            size="small"
          />
        </template>
        <v-card-title class="text-wrap" data-testid="title">{{
          title
        }}</v-card-title>
        <template v-if="hasClose" #append>
          <v-btn
            :icon="mdiClose"
            data-testid="close"
            size="small"
            variant="text"
            @click="$emit('update:modelValue', false)"
          />
        </template>
      </v-card-item>
      <v-card-text>
        <div data-testid="message">{{ message }}</div>
        <div data-testid="slot">
          <slot />
        </div>
      </v-card-text>
      <v-card-actions class="ga-4 justify-end pa-6">
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
