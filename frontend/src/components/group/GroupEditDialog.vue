<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { type Group, type GroupDetailFields } from '@/models/group.model'

// --- Component Interface -----------------------------------------------------

const { group, isDuplicateName } = defineProps<{
  group: Group
  isDuplicateName: boolean
}>()

const emit = defineEmits<{
  (event: 'clear-duplicate-error'): void
  (event: 'submit', group: GroupDetailFields): void
}>()

const dialogVisible = defineModel<boolean>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm>>()
const formData = ref<GroupDetailFields>({
  description: '',
  name: '',
})
const isFormValid = ref(false)

// --- Watchers and Effects ----------------------------------------------------

// When parent sets the duplicated name flag, force re-validation so that the
// message is displayed.
watch(
  () => isDuplicateName,
  async (newVal) => {
    if (!newVal) {
      return
    }

    await nextTick()
    await form.value?.validate()
  },
)

// Prefill the form with the group's current values whenever the dialog is
// opened. This covers the case that the user opens the dialog, edits data,
// cancels, and opens it again - it should reset to the group's actual values,
// not the abandoned edits.
watch(
  () => dialogVisible.value,
  (newVal) => {
    if (newVal) {
      formData.value = {
        description: group.description,
        name: group.name,
      }
      isFormValid.value = false
    }
  },
  { immediate: true },
)

watch(
  () => [formData.value.name],
  () => {
    emit('clear-duplicate-error')
  },
)

// --- Component Methods -------------------------------------------------------

const dialogClose = () => (dialogVisible.value = false)

const handleSave = async () => {
  await form.value?.validate()

  if (isFormValid.value) {
    formData.value.name = formData.value.name.trim()
    formData.value.description = formData.value.description.trim()

    emit('submit', formData.value)
    // Let parent decide when to close the dialog
  }
}

const rules = {
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !isDuplicateName ||
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
      <v-card-title class="align-center d-flex justify-space-between">
        Edit group details
      </v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="isFormValid">
          <v-row>
            <v-col>
              <v-text-field
                v-model="formData.name"
                :rules="[
                  rules.required,
                  rules.maxLength(150),
                  rules.notDuplicated,
                ]"
                counter="150"
                required
              >
                <template #label>
                  Group name <span class="text-error">*</span>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                v-model="formData.description"
                :rules="[rules.required, rules.maxLength(500)]"
                counter="500"
                rows="1"
                auto-grow
                required
              >
                <template #label>
                  Group description <span class="text-error">*</span>
                </template>
              </v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="d-flex justify-end">
        <ButtonSecondary class="me-4" text="Cancel" @click="dialogClose" />
        <ButtonPrimary text="Save changes" @click="handleSave" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
