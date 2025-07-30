<script setup lang="ts">
import { computed, ref } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import type { TenantRequest } from '@/models'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

const props = defineProps<{
  tenantRequest: TenantRequest
}>()

const emit = defineEmits<{
  approved: []
  back: []
  rejected: [notes: string]
}>()

const selectedStatus = ref(props.tenantRequest.status)
const rejectionNotes = ref('')

// Copy these here so that the order can be controlled.
const statusOptions = [
  TENANT_REQUEST_STATUS.NEW,
  TENANT_REQUEST_STATUS.APPROVED,
  TENANT_REQUEST_STATUS.REJECTED,
]

const isFormValid = computed(() => {
  if (selectedStatus.value === TENANT_REQUEST_STATUS.APPROVED.value) {
    return true
  }

  if (selectedStatus.value === TENANT_REQUEST_STATUS.REJECTED.value) {
    return rejectionNotes.value.trim().length > 0
  }

  return false
})

const showNotesField = computed(() => {
  return selectedStatus.value === TENANT_REQUEST_STATUS.REJECTED.value
})

const handleBack = () => {
  emit('back')
}

const handleSubmit = () => {
  if (selectedStatus.value === TENANT_REQUEST_STATUS.APPROVED.value) {
    emit('approved')
  } else if (
    selectedStatus.value === TENANT_REQUEST_STATUS.REJECTED.value &&
    rejectionNotes.value.trim()
  ) {
    emit('rejected', rejectionNotes.value.trim())
  }
}
</script>

<template>
  <v-container class="pa-6">
    <h4 class="mb-12">Tenant Request: {{ tenantRequest.name }}</h4>

    <v-row>
      <v-col cols="4">
        <v-text-field
          :model-value="tenantRequest.createdBy"
          label="User Name (IDIR)"
          disabled
        />
      </v-col>
      <v-col cols="5">
        <v-text-field
          :model-value="tenantRequest.ministryName"
          label="Ministry/Organization"
          disabled
        />
      </v-col>
      <v-col cols="3">
        <v-text-field
          :model-value="tenantRequest.createdDate"
          label="Date of Request (YYYY-MM-DD)"
          disabled
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-text-field
          :model-value="tenantRequest.name"
          label="Requested Tenant Name"
          disabled
        />
      </v-col>
      <v-col cols="8">
        <v-textarea
          :model-value="tenantRequest.description"
          label="Description of Tenant"
          rows="1"
          auto-grow
          disabled
        ></v-textarea>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="4">
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="Status"
          variant="outlined"
        />
      </v-col>

      <v-col v-if="showNotesField" cols="8">
        <v-textarea
          v-model="rejectionNotes"
          label="Rejection Notes"
          placeholder="Please provide reason for rejection..."
          rows="1"
          variant="outlined"
          auto-grow
          required
        />
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12">
        <v-divider class="mb-4" />
        <div class="d-flex justify-start">
          <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            variant="text"
            @click="handleBack"
          >
            Back to All Requests
          </v-btn>
          <ButtonSecondary class="me-4" text="Cancel" @click="handleBack" />
          <ButtonPrimary
            :disabled="!isFormValid"
            text="Submit"
            @click="handleSubmit"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
