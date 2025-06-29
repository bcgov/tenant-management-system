<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { useAuthStore } from '@/stores'
import { MINISTRIES } from '@/utils/constants'

const props = defineProps<{
  isDuplicateName?: boolean
}>()

const emit = defineEmits<{
  (event: 'submit', payload: { name: string; ministryName: string }): void
  (event: 'clear-duplicate-error'): void
}>()

// Auto-bound v-model from parent
const dialogVisible = defineModel<boolean>()

const closeDialog = () => (dialogVisible.value = false)

// Form state
const formRef = ref<InstanceType<typeof VForm>>()
const formValid = ref(false)
const ministryName = ref('')
const name = ref('')
const authStore = useAuthStore()
const username = computed(() => authStore.user?.displayName || '')

// Clear the state when the dialog is opened. This is for the case that the
// user opens the dialog, enters data, cancels, and opens it again - the form
// should be empty.
watch(
  () => dialogVisible.value,
  async (newVal) => {
    if (newVal) {
      ministryName.value = ''
      name.value = ''
      formValid.value = false

      // Trigger validation when dialog is shown, so that the user knows which
      // fields are required.
      await nextTick()
      formRef.value?.validate()
    }
  },
)

// When parent sets the duplicated name flag, force re-validation so that the
// message is displayed.
watch(
  () => props.isDuplicateName,
  async () => {
    await nextTick()
    formRef.value?.validate()
  },
)

watch([ministryName, name], () => {
  emit('clear-duplicate-error')
})

// Validation
const rules = {
  maxLength: (max: number) => (v: string) =>
    !v || v.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !props.isDuplicateName ||
    'Name must be unique for this ministry/organization',
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
  <v-dialog
    v-model="dialogVisible"
    aria-label="Create New Tenant Dialog"
    max-width="600px"
  >
    <v-card class="pa-6">
      <v-card-title>Create New Tenant</v-card-title>
      <v-card-subtitle>
        <a href="#">Learn more about Multi-Tenancy</a>
      </v-card-subtitle>
      <v-card-text>
        <v-form ref="formRef" v-model="formValid">
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
                :rules="[
                  rules.required,
                  rules.maxLength(30),
                  rules.notDuplicated,
                ]"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="ministryName"
                :items="MINISTRIES"
                label="Ministry/Organization"
                :rules="[rules.required]"
                placeholder="Select an option..."
                required
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="d-flex justify-start">
        <ButtonSecondary text="Cancel" @click="closeDialog" />
        <ButtonPrimary
          text="Finish"
          :disabled="!formValid"
          @click="handleSubmit"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
