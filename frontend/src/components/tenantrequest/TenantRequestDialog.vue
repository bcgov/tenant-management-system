<script setup lang="ts">
import { mdiClose } from '@mdi/js'
import { nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { type TenantRequestDetailFields } from '@/models/tenantrequest.model'
import { MINISTRIES } from '@/utils/constants'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
}>()

const emit = defineEmits<{
  clearDuplicateError: []
  submit: [tenantRequestDetails: TenantRequestDetailFields]
}>()

const dialogVisible = defineModel<boolean>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm>>()
const formData = ref<TenantRequestDetailFields>({
  description: '',
  ministryName: '',
  name: '',
})
const isFormValid = ref(false)

// --- Watchers and Effects ----------------------------------------------------

// When parent sets the duplicated name flag, force re-validation so that the
// message is displayed.
watch(
  () => props.isDuplicateName,
  async () => {
    await nextTick()
    await form.value?.validate()
  },
)

// Clear the state when the dialog is opened. This is for the case that the
// user opens the dialog, enters data, cancels, and opens it again - the form
// should be empty.
watch(
  () => dialogVisible.value,
  async (newVal) => {
    if (newVal) {
      formData.value = {
        description: '',
        ministryName: '',
        name: '',
      }
      isFormValid.value = false
    }
  },
)

watch(
  () => [formData.value.name, formData.value.ministryName],
  () => {
    emit('clearDuplicateError')
  },
)

// --- Component Methods -------------------------------------------------------

const dialogClose = () => (dialogVisible.value = false)

const handleSubmit = async () => {
  await form.value?.validate()

  if (isFormValid.value) {
    formData.value.name = formData.value.name.trim()
    formData.value.ministryName = formData.value.ministryName.trim()
    formData.value.description = formData.value.description.trim()

    emit('submit', formData.value)
    // Let parent decide when to close the dialog
  }
}

const rules = {
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !props.isDuplicateName ||
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
  <v-dialog v-model="dialogVisible" max-width="800px">
    <v-card class="pa-6">
      <v-card-title class="align-center d-flex justify-space-between">
        Request New Tenant
        <v-btn
          :icon="mdiClose"
          variant="plain"
          @click="dialogVisible = false"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="isFormValid">
          <v-row no-gutters>
            <v-col class="pe-md-3" cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                :maxlength="30"
                :rules="[
                  rules.required,
                  rules.maxLength(30),
                  rules.notDuplicated,
                ]"
                required
              >
                <template #label>
                  Name of Tenant <span class="text-error">*</span>
                </template>
              </v-text-field>
            </v-col>
            <v-col class="ps-md-3" cols="12" md="6">
              <v-select
                v-model="formData.ministryName"
                :items="MINISTRIES"
                :rules="[rules.required]"
                placeholder="Select an option..."
                required
              >
                <template #label>
                  Ministry/Organization <span class="text-error">*</span>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <v-textarea
            v-model="formData.description"
            :rules="[rules.required, rules.maxLength(500)]"
            counter="500"
            rows="1"
            auto-grow
            required
          >
            <template #label>
              Description of Tenant <span class="text-error">*</span>
            </template>
          </v-textarea>
        </v-form>
      </v-card-text>

      <v-card-actions class="d-flex justify-end">
        <ButtonSecondary class="me-4" text="Cancel" @click="dialogClose" />
        <ButtonPrimary text="Submit Request" @click="handleSubmit" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
