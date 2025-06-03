<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { useNotification } from '@/composables/useNotification'
import type { Tenant } from '@/models/tenant.model'
import { MINISTRIES } from '@/utils/constants'

const props = defineProps<{
  deleteDialog: boolean
  isEditing: boolean
  tenant?: Tenant
}>()

type EmitFn = {
  (event: 'update', tenant: Partial<Tenant>): void
  (event: 'update:deleteDialog', value: boolean): void
  (event: 'update:isEditing', value: boolean): void
}
const emit = defineEmits<EmitFn>()

// Form state
const formData = ref<Partial<Tenant>>({
  description: '',
  ministryName: '',
  name: '',
})

const form = ref<any>(null)
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

const { addNotification } = useNotification()

const owner = computed(() => {
  if (!props.tenant?.users?.length) {
    addNotification(
      `Critical: Tenant "${props.tenant?.name}" has no users assigned`,
      'error',
    )
    return null
  }
  return props.tenant.users[0]
})

async function handleSubmit() {
  const { valid } = await form.value.validate()
  if (valid) {
    emit('update', formData.value)
    emit('update:isEditing', false)
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
  <div v-if="tenant" class="pa-4 bg-grey-lighten-5">
    <v-row>
      <!-- Form content -->
      <v-col cols="10">
        <v-form
          ref="form"
          @submit.prevent="handleSubmit"
          v-model="isFormValid"
          class="mt-6"
        >
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="isEditing"
                v-model="formData.name"
                label="Tenant Name"
                :rules="[(v) => !!v || 'Name is required']"
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
                label="Ministry/Organization"
                :rules="[(v) => !!v || 'Ministry is required']"
                placeholder="Select an option..."
                required
              />
              <v-text-field
                v-else
                :model-value="tenant.ministryName"
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
                rows="1"
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
            <v-col class="d-flex justify-start gap-4">
              <ButtonSecondary text="Cancel" @click="handleCancel" />
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
      <v-col cols="2" class="d-flex align-start justify-end">
        <v-menu>
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
              <v-list-item-title>
                {{ isEditing ? 'Cancel Edit' : 'Edit Tenant' }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="openDeleteDialog" :disabled="isEditing">
              <v-list-item-title>Delete Tenant</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </div>
</template>
