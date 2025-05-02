<script setup lang="ts">
import { computed, ref } from 'vue'

import { getUser } from '@/services/keycloak'
import { MINISTRIES } from '@/utils/constants'

// Props and emits
const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['close', 'submit'])

// Reactive form state
const username = ref(getUser().displayName)
const name = ref('')
const ministryName = ref('')
const formValid = ref(false)

const rules = {
  required: (value: any) => !!value || 'Required',
}

const visible = computed(() => props.visible)

const handleSubmit = () => {
  if (formValid.value) {
    emit('submit', {
      name: name.value,
      ministryName: ministryName.value,
    })
    // Optionally reset form here or let parent decide
    name.value = ''
    ministryName.value = ''
  }
}

const closeDialog = () => emit('close')
</script>

<template>
  <v-dialog
    :model-value="props.visible"
    @update:modelValue="emit('close')"
    max-width="600px"
  >
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
                :rules="[rules.required]"
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
        <v-btn variant="text" :disabled="!formValid" @click="handleSubmit"
          >Finish</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
