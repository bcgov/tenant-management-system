<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VForm, VInput } from 'vuetify/components'

import ServiceRoleList from '@/components/service/ServiceRoleList.vue'
import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { type ServiceDetailFields } from '@/models/service.model'
import { type ServiceRoleDetailFields } from '@/models/servicerole.model'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
}>()

const emit = defineEmits<{
  clearDuplicateError: []
  submit: [serviceDetails: ServiceDetailFields]
}>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm>>()
const formData = ref<ServiceDetailFields>({
  clientIdentifier: '',
  description: '',
  displayName: '',
  landingPageUrl: '',
  name: '',
  roles: [],
})
const isFormValid = ref(false)

const missingRolesError = ref<InstanceType<typeof VInput>>()

const serviceRoleList = ref<InstanceType<typeof ServiceRoleList>>()

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

watch(
  () => [formData.value.name],
  () => {
    emit('clearDuplicateError')
  },
)

// --- Validation Rules --------------------------------------------------------

const rules = {
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
  roleRequired: (value: string[]) =>
    value.length > 0 || 'At least one role is required',
  validUrl: (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return 'Must be a valid URL'
    }
  },
}

// --- Component Methods -------------------------------------------------------

const handleAddServiceRole = async () => {
  formData.value.roles.push({
    description: '',
    identityProviders: [],
    name: '',
  } as ServiceRoleDetailFields)
  await missingRolesError.value?.validate()
}

const handleRemoveServiceRole = async (index: number) => {
  formData.value.roles.splice(index, 1)
  await missingRolesError.value?.validate()
}

const handleSubmit = async () => {
  const [formResult, rolesValid] = await Promise.all([
    form.value?.validate(),
    serviceRoleList.value?.validate() ?? Promise.resolve(true),
  ])

  if (formResult?.valid && rolesValid) {
    formData.value.clientIdentifier = formData.value.clientIdentifier.trim()
    formData.value.description = formData.value.description.trim()
    formData.value.displayName = formData.value.displayName.trim()
    formData.value.landingPageUrl = formData.value.landingPageUrl.trim()
    formData.value.name = formData.value.name.trim()

    formData.value.roles = formData.value.roles.map((role) => ({
      ...role,
      description: role.description.trim(),
      name: role.name.trim(),
    }))

    emit('submit', formData.value)
  }
}

const handleUpdateServiceRole = (
  index: number,
  fields: ServiceRoleDetailFields,
) => {
  formData.value.roles[index] = fields
}
</script>

<template>
  <v-container class="ms-6">
    <v-form ref="form" v-model="isFormValid">
      <h4>1. Add a Connected Service</h4>

      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.name"
            :maxlength="30"
            :rules="[rules.required, rules.maxLength(30), rules.notDuplicated]"
            required
          >
            <template #label>Name <span class="text-error">*</span></template>
          </v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.displayName"
            :maxlength="100"
            :rules="[rules.required, rules.maxLength(100)]"
            required
          >
            <template #label>
              Display Name
              <span class="text-error">*</span>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-textarea
            v-model="formData.description"
            :rules="[rules.required, rules.maxLength(500)]"
            counter="500"
            rows="1"
            auto-grow
            required
          >
            <template #label>
              Description <span class="text-error">*</span>
            </template>
          </v-textarea>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.clientIdentifier"
            :maxlength="55"
            :rules="[rules.required, rules.maxLength(55)]"
            required
          >
            <template #label>
              Client Identifier
              <span class="text-error">*</span>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.landingPageUrl"
            :maxlength="500"
            :rules="[rules.required, rules.maxLength(500), rules.validUrl]"
            required
          >
            <template #label>
              Landing Page URL
              <span class="text-error">*</span>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-divider class="my-12" />

      <h4>2. Add Connected Service Roles</h4>

      <p>
        Define roles for this service. Roles control what users can access. Add
        each role manually to match the roles configured in your application.
      </p>

      <v-input
        ref="missingRolesError"
        :model-value="formData.roles"
        :rules="[rules.roleRequired]"
        hide-details="auto"
      />
      <ServiceRoleList
        ref="serviceRoleList"
        :service-roles="formData.roles"
        class="mt-12"
        @add-service-role="handleAddServiceRole"
        @remove-service-role="handleRemoveServiceRole"
        @update-service-role="handleUpdateServiceRole"
      />

      <v-divider class="my-12" />

      <ButtonPrimary text="Create Connected Service" @click="handleSubmit" />
      <p>Once created, this service will be available to all tenants.</p>
    </v-form>
  </v-container>
</template>
