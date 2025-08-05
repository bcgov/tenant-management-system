<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import type { Group, GroupDetailFields, Tenant } from '@/models'
import { ROLES } from '@/utils/constants'
import { currentUserHasRole } from '@/utils/permissions'

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  isDuplicateName: boolean
  isEditing: boolean
  group: Group
  tenant: Tenant
}>()

const emit = defineEmits<{
  (event: 'clear-duplicate-error'): void
  (event: 'update', groupDetails: GroupDetailFields): void
  (event: 'update:isEditing', value: boolean): void
}>()

// --- Component State ---------------------------------------------------------

const form = ref<InstanceType<typeof VForm> | null>(null)
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

watch(
  () => props.group,
  (newGroup) => {
    if (newGroup) {
      formData.value = {
        description: newGroup.description,
        name: newGroup.name,
      }
    }
  },
  { immediate: true },
)

watch(
  () => formData.value.name,
  () => {
    emit('clear-duplicate-error')
  },
)

// --- Computed Values ---------------------------------------------------------

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

// --- Component Methods -------------------------------------------------------

function handleCancel() {
  // Reset form data to original tenant values
  formData.value = {
    description: props.group.description,
    name: props.group.name,
  }

  emit('update:isEditing', false)
}

async function handleSubmit() {
  const result = await form.value?.validate()
  if (result?.valid) {
    formData.value.name = formData.value.name.trim()
    formData.value.description = formData.value.description.trim()

    emit('update', formData.value)
  }
}

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
}

function toggleEdit() {
  emit('update:isEditing', !props.isEditing)
}
</script>

<template>
  <v-row class="pa-4" no-gutters>
    <!-- Form content -->
    <v-col cols="10">
      <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-if="isEditing"
              v-model="formData.name"
              :rules="[
                rules.required,
                rules.maxLength(30),
                rules.notDuplicated,
              ]"
              label="Group Name"
              required
            />
            <v-text-field
              v-else
              :model-value="group.name"
              label="Group Name"
              disabled
            />
          </v-col>
          <v-col cols="6">
            <v-textarea
              v-if="isEditing"
              v-model="formData.description"
              :rules="[rules.required, rules.maxLength(500)]"
              counter="500"
              label="Group Description"
              rows="1"
              auto-grow
              required
            ></v-textarea>
            <v-textarea
              v-else
              :model-value="group.description"
              label="Group Description"
              rows="1"
              disabled
            ></v-textarea>
          </v-col>
        </v-row>
        <v-row v-if="isEditing">
          <v-col class="d-flex justify-end">
            <ButtonSecondary class="me-4" text="Cancel" @click="handleCancel" />
            <ButtonPrimary
              :disabled="!isFormValid"
              text="Save and Close"
              @click="handleSubmit"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-col>

    <!-- Menu on right side -->
    <v-col v-if="isUserAdmin" class="d-flex justify-end" cols="2">
      <v-btn
        v-if="isEditing"
        rounded="lg"
        size="small"
        variant="outlined"
        icon
        @click="handleCancel"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>

      <v-menu v-else>
        <template #activator="{ props: slotProps }">
          <v-btn
            rounded="lg"
            size="small"
            variant="outlined"
            icon
            v-bind="slotProps"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="toggleEdit">
            <v-list-item-title>Edit Group</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-col>
  </v-row>
</template>
