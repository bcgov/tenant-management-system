<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { MINISTRIES } from '@/utils/constants'

// Props and emits
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: { name: string; ministryName: string }): void
}>()

const closeDialog = () => emit('update:modelValue', false)

// Form state
const formValid = ref(false)
const ministryName = ref('')
const name = ref('')
const authStore = useAuthStore()
const username = computed(() => authStore.user?.displayName || '')

// Clear the state when the dialog is opened. This is for the case that the
// user opens the dialog, enters data, cancels, and opens it again - the form
// should be empty.
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      ministryName.value = ''
      name.value = ''
      formValid.value = false
    }
  },
)

// Validation
const rules = {
  maxLength: (max: number) => (v: string) =>
    !v || v.length <= max || `Must be ${max} characters or less`,
  required: (value: any) => !!value || 'Required',
}

const handleSubmit = () => {
  if (formValid.value) {
    emit('submit', {
      name: name.value,
      ministryName: ministryName.value,
    })
    // Let parent decide when to close the dialog
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" persistent max-width="600px">
    <v-card>
      <v-card-title>Create New Tenant</v-card-title>
      <v-card-subtitle>
        <a href="#">Learn more about Multi-Tenancy</a>
        <v-icon color="primary">mdi-information-outline</v-icon>
      </v-card-subtitle>
      <v-card-text>
        <v-form v-model="formValid">
          <v-text-field
            v-model="username"
            label="Tenant Owner"
            readonly
            disabled
          />
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="name"
                label="Name of Tenant"
                :maxlength="30"
                :rules="[rules.maxLength(30), rules.required]"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="ministryName"
                :items="MINISTRIES"
                label="BC Ministries"
                :rules="[rules.required]"
                placeholder="Select an option..."
                required
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn variant="text" :disabled="!formValid" @click="handleSubmit">
          Finish
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
