<script setup lang="ts">
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
  }>(),
  {
    title: '',
    message: '',
    buttons: () => [],
    hasClose: false,
    dialogType: null,
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
      return 'mdi-alert-outline'
    case 'error':
      return 'mdi-alert-octagon-outline'
    case 'success':
      return 'mdi-check-circle-outline'
    default:
      return ''
  }
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title v-if="title" class="text-h6">
        <v-row>
          <v-col>
            <v-icon
              v-if="dialogType !== null"
              :color="dialogType"
              class="ma-2"
              size="small"
            >
              {{ iconType }}
            </v-icon>
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
            <v-icon>mdi-close</v-icon>
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

<style scoped></style>
