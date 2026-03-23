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
  text: string
  action: string
  type?: 'primary' | 'secondary'
}

// --- Component Interface -----------------------------------------------------

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    buttons?: {
      text: string
      action: string
      type?: 'primary' | 'secondary'
    }[]
    hasClose?: boolean
    dialogType?: string | null
    maxWidth?: number
  }>(),
  {
    title: '',
    message: '',
    buttons: () => [],
    hasClose: false,
    dialogType: null,
    maxWidth: 500,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'buttonClick', action: string): void
}>()

// --- Component Methods -------------------------------------------------------

function handleButtonClick(action: string) {
  emit('buttonClick', action)
  emit('update:modelValue', false)
}

// --- Computed Values ---------------------------------------------------------

const iconType = computed(() => {
  switch (props.dialogType) {
    case 'warning':
      return mdiAlertOutline
    case 'error':
      return mdiAlertOctagonOutline
    case 'success':
      return mdiCheckCircleOutline
    default:
      return ''
  }
})
</script>

<template>
  <v-dialog
    :max-width="maxWidth ? maxWidth : 500"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title v-if="title" class="text-h6">
        <v-row>
          <v-col>
            <v-icon
              v-if="dialogType !== null"
              :color="dialogType"
              :icon="iconType"
              class="ma-2"
              size="small"
            />
            {{ title }}
          </v-col>
          <v-spacer />
          <v-btn
            v-if="hasClose === true"
            class="ma-2"
            size="small"
            variant="text"
            icon
            @click="$emit('update:modelValue', false)"
          >
            <v-icon :icon="mdiClose"></v-icon>
          </v-btn>
        </v-row>
      </v-card-title>
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
