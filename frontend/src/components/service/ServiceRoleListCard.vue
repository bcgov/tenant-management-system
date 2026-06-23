<script setup lang="ts">
import { mdiCheckCircleOutline, mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { computed, nextTick, ref, watch } from 'vue'
import { VForm, VTextField } from 'vuetify/components'

import { type ServiceRoleDetailFields } from '@/models/servicerole.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
  modelValue: ServiceRoleDetailFields
}>()

const emit = defineEmits<{
  (event: 'remove-role'): void
  (event: 'update:modelValue', fields: ServiceRoleDetailFields): void
}>()

// --- Component State ---------------------------------------------------------

const IDENTITY_PROVIDERS = [
  { label: 'IDIR', value: 'idir' },
  { label: 'Business BCeID', value: 'bceidbusiness' },
]

const form = ref<InstanceType<typeof VForm>>()
const isExpanded = ref(true)
const isFormValid = ref(false)

const nameField = ref<InstanceType<typeof VTextField>>()

// --- Watchers and Effects ----------------------------------------------------

watch(
  () => props.isDuplicateName,
  async () => {
    await nextTick()
    await nameField.value?.validate()
  },
)

// --- Computed Values ---------------------------------------------------------

const displayName = computed(() => {
  return localData.value.name ? localData.value.name : 'New Role'
})

const isComplete = computed(() => {
  return (
    localData.value.description &&
    localData.value.identityProviders.length > 0 &&
    localData.value.name &&
    !props.isDuplicateName
  )
})

const localData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// --- Validation Rules --------------------------------------------------------

const rules = {
  idpRequired: (value: string[]) =>
    value.length > 0 || 'At least one identity provider is required',
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () => !props.isDuplicateName || 'Name must be unique',
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

// --- Component Methods -------------------------------------------------------

const handleRemoveRole = () => {
  emit('remove-role')
}

const idpClearAll = () => {
  localData.value.identityProviders = []
}

const idpSelectAll = () => {
  localData.value.identityProviders = IDENTITY_PROVIDERS.map((p) => p.value)
}

const validate = async () => {
  const result = await form.value?.validate()
  const valid = result?.valid ?? false

  if (!valid) {
    isExpanded.value = true
  }

  return valid
}

defineExpose({ validate })
</script>

<template>
  <v-card color="surface-light-gray">
    <v-card-title class="d-flex align-center justify-space-between">
      <span>
        {{ displayName }}
        <span v-if="isComplete" class="text-success">
          <v-icon :icon="mdiCheckCircleOutline" size="x-small" />
          Completed
        </span>
        <span v-else>- Incomplete</span>
      </span>

      <span>
        <v-btn
          class="text-error"
          density="compact"
          variant="text"
          @click="handleRemoveRole"
        >
          Remove Role
        </v-btn>

        <v-btn
          :icon="isExpanded ? mdiChevronUp : mdiChevronDown"
          density="compact"
          variant="text"
          @click="isExpanded = !isExpanded"
        />
      </span>
    </v-card-title>

    <v-expand-transition>
      <div v-show="isExpanded">
        <v-card-text>
          <v-form ref="form" v-model="isFormValid">
            <v-row>
              <v-text-field
                ref="nameField"
                v-model="localData.name"
                :maxlength="30"
                :rules="[
                  rules.required,
                  rules.maxLength(30),
                  rules.notDuplicated,
                ]"
                required
                @update:model-value="localData = { ...localData, name: $event }"
              >
                <template #label>
                  Role Name <span class="text-error">*</span>
                </template>
              </v-text-field>
            </v-row>

            <v-row>
              <v-textarea
                v-model="localData.description"
                :rules="[rules.required, rules.maxLength(500)]"
                counter="500"
                rows="1"
                auto-grow
                required
                @update:model-value="
                  localData = { ...localData, description: $event }
                "
              >
                <template #label>
                  Description <span class="text-error">*</span>
                </template>
              </v-textarea>
            </v-row>

            <h5>Identity Providers</h5>
            <p>Choose which identity providers can use this role.</p>

            <v-input
              :model-value="localData.identityProviders"
              :rules="[rules.idpRequired]"
              hide-details="auto"
            />

            <div class="d-flex align-center justify-space-between my-2">
              <div>
                <a
                  class="text-body-small text-primary"
                  href="#"
                  @click.prevent="idpSelectAll"
                  >Select All</a
                >
                <span class="text-body-small mx-1">|</span>
                <a
                  class="text-body-small text-primary"
                  href="#"
                  @click.prevent="idpClearAll"
                  >Clear All</a
                >
              </div>
            </div>
            <v-checkbox
              v-for="provider in IDENTITY_PROVIDERS"
              :key="provider.value"
              v-model="localData.identityProviders"
              :label="provider.label"
              :value="provider.value"
              density="comfortable"
              hide-details
              @update:model-value="
                localData = { ...localData, identityProviders: $event ?? [] }
              "
            />
          </v-form>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>
