<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import type { GroupDetailFields } from '@/models'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
}>()

const emit = defineEmits<{
  (event: 'clear-duplicate-error'): void
  (event: 'submit', group: GroupDetailFields, addUser: boolean): void
}>()

const dialogVisible = defineModel<boolean>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm>>()
const addUser = ref(false)
const formData = ref<GroupDetailFields>({
  description: '',
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
      addUser.value = false
      formData.value = {
        description: '',
        name: '',
      }
      isFormValid.value = false

      // Trigger validation when dialog is shown, so that the user knows which
      // fields are required.
      await nextTick()
      form.value?.validate()
    }
  },
)

watch(
  () => [formData.value.name],
  () => {
    emit('clear-duplicate-error')
  },
)

// --- Component Methods -------------------------------------------------------

const dialogClose = () => (dialogVisible.value = false)

const handleSubmit = () => {
  if (isFormValid.value) {
    formData.value.name = formData.value.name.trim()
    formData.value.description = formData.value.description.trim()

    emit('submit', formData.value, addUser.value)
    // Let parent decide when to close the dialog
  }
}

const rules = {
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !props.isDuplicateName ||
    'This name is already in use. Please choose a unique group name.',
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
  <v-dialog v-model="dialogVisible" max-width="600px">
    <v-card class="pa-6">
      <v-card-title>Create a Group</v-card-title>
      <v-card-subtitle class="my-6">
        <a href="#">Learn more about Groups</a>
      </v-card-subtitle>
      <v-card-text>
        <v-form ref="form" v-model="isFormValid">
          <v-row>
            <v-col>
              <v-text-field
                v-model="formData.name"
                :maxlength="30"
                :rules="[
                  rules.required,
                  rules.maxLength(30),
                  rules.notDuplicated,
                ]"
                label="Group Name"
                required
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                v-model="formData.description"
                :rules="[rules.required, rules.maxLength(500)]"
                counter="500"
                label="Group Description"
                rows="1"
                auto-grow
                required
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-checkbox
                v-model="addUser"
                label="Add me as a user to this group"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="d-flex justify-end">
        <ButtonSecondary class="me-4" text="Cancel" @click="dialogClose" />
        <ButtonPrimary
          :disabled="!isFormValid"
          text="Submit"
          @click="handleSubmit"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
