<script setup lang="ts">
import { computed, ref } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { TenantRequest } from '@/models/tenantrequest.model'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  erroredApproving: boolean
  tenantRequest: TenantRequest
}>()

const emit = defineEmits<{
  approved: [name: string]
  back: []
  rejected: [notes: string]
}>()

// --- Component State ---------------------------------------------------------

const name = ref(props.tenantRequest.name)
const rejectionNotes = ref('')
const selectedStatus = ref(null)

const statusOptions = [
  TENANT_REQUEST_STATUS.APPROVED,
  TENANT_REQUEST_STATUS.REJECTED,
]

// --- Computed Values ---------------------------------------------------------

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
  return (
    props.tenantRequest.status === TENANT_REQUEST_STATUS.REJECTED.value ||
    selectedStatus.value === TENANT_REQUEST_STATUS.REJECTED.value
  )
})

const statusAlreadySet = computed(() => {
  return props.tenantRequest.status !== TENANT_REQUEST_STATUS.NEW.value
})

// --- Component Methods -------------------------------------------------------

const handleBack = () => {
  emit('back')
}

const handleSubmit = () => {
  if (selectedStatus.value === TENANT_REQUEST_STATUS.APPROVED.value) {
    emit('approved', name.value.trim())
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
          readonly
        />
      </v-col>
      <v-col cols="5">
        <v-text-field
          :model-value="tenantRequest.ministryName"
          label="Ministry/Organization"
          readonly
        />
      </v-col>
      <v-col cols="3">
        <v-text-field
          :model-value="tenantRequest.createdDate"
          label="Date of Request (YYYY-MM-DD)"
          readonly
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-text-field
          v-if="statusAlreadySet || !erroredApproving"
          :model-value="tenantRequest.name"
          label="Requested Tenant Name"
          readonly
        />
        <v-text-field v-else v-model="name" label="Requested Tenant Name" />
        <div v-if="erroredApproving" class="text-error mt-n5">
          {{ $t('tenants.errors.uniqueName') }}
        </div>
      </v-col>
      <v-col cols="8">
        <v-textarea
          :model-value="tenantRequest.description"
          label="Description of Tenant"
          rows="1"
          auto-grow
          readonly
        ></v-textarea>
      </v-col>
    </v-row>

    <v-row v-if="statusAlreadySet" class="mt-4">
      <v-col cols="4">
        <v-text-field
          :model-value="tenantRequest.status"
          label="Status"
          readonly
        />
      </v-col>
      <v-col v-if="showNotesField" cols="8">
        <v-textarea
          :auto-grow="true"
          :model-value="tenantRequest.rejectionReason"
          label="Rejection Notes"
          rows="1"
          variant="filled"
          readonly
        />
      </v-col>
    </v-row>
    <v-row v-else class="mt-4">
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
        <div v-if="statusAlreadySet" class="d-flex justify-start">
          <ButtonPrimary
            class="me-4"
            text="Back to All Requests"
            @click="handleBack"
          />
        </div>
        <div v-else class="d-flex justify-start">
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
