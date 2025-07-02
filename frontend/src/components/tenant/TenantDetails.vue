<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { useNotification } from '@/composables'
import type { Tenant } from '@/models'
import { MINISTRIES } from '@/utils/constants'

const props = defineProps<{
  deleteDialog: boolean
  isDuplicateName: boolean
  isEditing: boolean
  tenant?: Tenant
}>()

const emit = defineEmits<{
  (event: 'clear-duplicate-error'): void
  (event: 'update', tenant: Partial<Tenant>): void
  (event: 'update:deleteDialog', value: boolean): void
  (event: 'update:isEditing', value: boolean): void
}>()

// Form state
const form = ref<any>(null)
const formData = ref<Partial<Tenant>>({
  description: '',
  ministryName: '',
  name: '',
})
const isFormValid = ref(false)

// Reset form when tenant changes
watch(
  () => props.tenant,
  (newTenant) => {
    if (newTenant) {
      formData.value = {
        description: newTenant.description,
        ministryName: newTenant.ministryName,
        name: newTenant.name,
      }
    }
  },
  { immediate: true },
)

// Validation
const rules = {
  maxLength: (max: number) => (v: string) =>
    !v || v.length <= max || `Must be ${max} characters or less`,
  notDuplicated: () =>
    !props.isDuplicateName ||
    'Name must be unique for this ministry/organization',
  required: (value: any) => !!value || 'Required',
}

// When parent sets the duplicated name flag, force re-validation so that the
// message is displayed.
watch(
  () => props.isDuplicateName,
  async () => {
    await nextTick()
    form.value?.validate()
  },
)

watch(
  () => [formData.value.name, formData.value.ministryName],
  () => {
    emit('clear-duplicate-error')
  },
)

const { addNotification } = useNotification()

const owner = computed(() => {
  if (!props.tenant?.users?.length) {
    addNotification(
      `Critical: Tenant "${props.tenant?.name}" has no users assigned`,
      'error',
    )

    return null
  }

  return props.tenant.users[0] // TODO - this isn't right.
})

async function handleSubmit() {
  const { valid } = await form.value.validate()
  if (valid) {
    emit('update', formData.value)
  }
}

function handleCancel() {
  // Reset form data to original tenant values
  if (props.tenant) {
    formData.value = {
      description: props.tenant.description,
      ministryName: props.tenant.ministryName,
      name: props.tenant.name,
    }
  }
  emit('update:isEditing', false)
}

function openDeleteDialog() {
  emit('update:deleteDialog', true)
}

function toggleEdit() {
  emit('update:isEditing', !props.isEditing)
}
</script>

<template>
  <div v-if="tenant" class="bg-grey-lighten-5">
    <v-row class="pa-4" no-gutters>
      <!-- Form content -->
      <v-col cols="12" lg="10">
        <v-form ref="form" @submit.prevent="handleSubmit" v-model="isFormValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="isEditing"
                v-model="formData.name"
                label="Tenant Name"
                :rules="[
                  rules.required,
                  rules.maxLength(30),
                  rules.notDuplicated,
                ]"
                required
              />
              <v-text-field
                v-else
                :model-value="tenant.name"
                label="Tenant Name"
                disabled
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-if="isEditing"
                v-model="formData.ministryName"
                :items="MINISTRIES"
                :rules="[(v) => !!v || 'Ministry is required']"
                label="Ministry/Organization"
                placeholder="Select an option..."
                required
              />
              <v-text-field
                v-else
                :model-value="tenant.ministryName"
                :rules="[rules.required, rules.notDuplicated]"
                label="Ministry/Organization"
                disabled
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="owner?.userName ?? 'No owner assigned'"
                label="Tenant Owner"
                disabled
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-textarea
                v-if="isEditing"
                v-model="formData.description"
                label="Tenant Description"
                auto-grow
                counter="500"
                rows="1"
                :rules="[rules.required, rules.maxLength(500)]"
                required
              ></v-textarea>
              <v-textarea
                v-else
                :model-value="tenant.description"
                label="Tenant Description"
                rows="1"
                disabled
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row v-if="isEditing">
            <v-col class="d-flex justify-start">
              <ButtonSecondary
                class="me-4"
                text="Cancel"
                @click="handleCancel"
              />
              <ButtonPrimary
                text="Save and Close"
                :disabled="!isFormValid"
                @click="handleSubmit"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-col>

      <!-- Menu on right side -->
      <v-col cols="12" lg="2" class="d-flex justify-end">
        <v-btn
          v-if="isEditing"
          icon
          variant="outlined"
          rounded="lg"
          size="small"
          @click="handleCancel"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-menu v-else>
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              variant="outlined"
              rounded="lg"
              size="small"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="toggleEdit">
              <v-list-item-title>Edit Tenant</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openDeleteDialog">
              <v-list-item-title>Delete Tenant</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </div>
</template>
