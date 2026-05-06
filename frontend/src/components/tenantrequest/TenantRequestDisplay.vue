<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { TenantRequest } from '@/models/tenantrequest.model'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
  tenantRequest: TenantRequest
}>()

const emit = defineEmits<{
  approved: [name: string]
  cancel: []
  clearDuplicateError: []
  rejected: [notes: string]
}>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm>>()
const formData = reactive({
  name: props.tenantRequest.name,
  rejectionNotes: '',
  status:
    props.tenantRequest.status === TENANT_REQUEST_STATUS.NEW.value
      ? null
      : props.tenantRequest.status,
})
const isFormValid = ref(false)

const isNameEditable = ref(false)

const statusOptions = [
  TENANT_REQUEST_STATUS.APPROVED,
  TENANT_REQUEST_STATUS.REJECTED,
]

// --- Computed Values ---------------------------------------------------------

const isReadonly = computed(() => {
  return props.tenantRequest.status !== TENANT_REQUEST_STATUS.NEW.value
})

const showNotesField = computed(() => {
  return formData.status === TENANT_REQUEST_STATUS.REJECTED.value
})

// --- Watchers and Effects ----------------------------------------------------

// When parent sets the duplicated name flag, force re-validation so that the
// message is displayed.
watch(
  () => props.isDuplicateName,
  async () => {
    isNameEditable.value = true
    await nextTick()
    await form.value?.validate()
  },
)

// When the user changes the name (due to a duplicate) then clear the error.
watch(
  () => [formData.name],
  () => {
    emit('clearDuplicateError')
  },
)

// When the status changes, the name or rejection notes may have been edited.
// Clear those edits.
watch(
  () => formData.status,
  () => {
    formData.name = props.tenantRequest.name
    formData.rejectionNotes = ''
    isNameEditable.value = false
  },
)

// --- Component Methods -------------------------------------------------------

const handleCancel = () => {
  emit('cancel')
}

const handleSubmit = async () => {
  await form.value?.validate()

  if (isFormValid.value) {
    if (formData.status === TENANT_REQUEST_STATUS.APPROVED.value) {
      isNameEditable.value = false
      emit('approved', formData.name.trim())
    } else if (formData.status === TENANT_REQUEST_STATUS.REJECTED.value) {
      emit('rejected', formData.rejectionNotes.trim())
    }

    // Let parent decide when to close
  }
}

const rules = {
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !props.isDuplicateName ||
    'Name must be unique for this ministry/organization',
  notSameName: (value: string) =>
    value.trim() !== props.tenantRequest.name.trim() ||
    'Name must be unique for this ministry/organization',
  required: (value: string) => {
    if (!value) {
      return 'Required'
    }

    if (!value.trim()) {
      return 'Cannot be only spaces'
    }

    return true
  },
}
</script>

<template>
  <v-container class="pa-6">
    <h4 class="mb-12">Tenant Request: {{ tenantRequest.name }}</h4>

    <v-form ref="form" v-model="isFormValid">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            :model-value="tenantRequest.createdBy"
            label="Requested By"
            disabled
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            :model-value="tenantRequest.ministryName"
            label="Ministry/Organization"
            disabled
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            :model-value="tenantRequest.createdDate"
            label="Date of Request (YYYY-MM-DD)"
            disabled
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-if="isReadonly || !isNameEditable"
            :model-value="tenantRequest.name"
            label="Name of Tenant"
            disabled
          />
          <v-text-field
            v-else
            v-model="formData.name"
            :maxlength="30"
            :rules="[
              rules.required,
              rules.maxLength(30),
              rules.notDuplicated,
              rules.notSameName,
            ]"
            variant="outlined"
          >
            <template #label>
              Name of Tenant <span class="text-error">*</span>
            </template>
          </v-text-field>
        </v-col>
        <v-col cols="12" md="8">
          <v-textarea
            :model-value="tenantRequest.description"
            label="Description of Tenant"
            rows="1"
            auto-grow
            disabled
          ></v-textarea>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-if="isReadonly"
            :model-value="tenantRequest.status"
            label="Status"
            disabled
          />
          <v-select
            v-else
            v-model="formData.status"
            :items="statusOptions"
            :rules="[rules.required]"
            variant="outlined"
          >
            <template #label>
              Status <span class="text-error">*</span>
            </template>
          </v-select>
        </v-col>

        <v-col v-if="showNotesField" cols="12" md="8">
          <v-textarea
            v-if="isReadonly"
            :model-value="tenantRequest.rejectionReason"
            label="Rejection Notes"
            rows="1"
            auto-grow
            disabled
          />
          <v-textarea
            v-else
            v-model="formData.rejectionNotes"
            :maxlength="500"
            :rules="[rules.required, rules.maxLength(500)]"
            counter="500"
            rows="1"
            variant="outlined"
            auto-grow
          >
            <template #label>
              Rejection Notes <span class="text-error">*</span>
            </template>
          </v-textarea>
        </v-col>
      </v-row>

      <v-row class="mt-6">
        <v-col cols="12">
          <v-divider class="mb-4" />
          <div class="d-flex justify-start">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />
            <ButtonPrimary
              v-if="!isReadonly"
              text="Submit"
              @click="handleSubmit"
            />
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>
