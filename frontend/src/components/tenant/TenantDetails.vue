<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'
import { ref, watch } from 'vue'

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

function handleSubmit() {
  emit('update', formData.value)
}

function openDeleteDialog() {
  emit('update:deleteDialog', true)
}

function toggleEdit() {
  emit('update:isEditing', !props.isEditing)
}
</script>

<template>
  <div v-if="tenant">
    <v-row>
      <!-- Form content -->
      <v-col cols="11">
        <v-form @submit.prevent="handleSubmit">
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
                readonly
                class="readonly-field"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="isEditing"
                v-model="formData.ministryName"
                label="Ministry/Organization"
                :rules="[(v) => !!v || 'Ministry is required']"
                required
              />
              <v-text-field
                v-else
                :model-value="tenant.ministryName"
                label="Ministry/Organization"
                readonly
                class="readonly-field"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="tenant.users[0]?.userName"
                label="Tenant Owner"
                readonly
                class="readonly-field"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="isEditing"
                v-model="formData.description"
                label="Tenant Description"
              />
              <v-text-field
                v-else
                :model-value="tenant.description"
                label="Tenant Description"
                readonly
                class="readonly-field"
              />
            </v-col>
          </v-row>
          <v-row v-if="isEditing">
            <v-col class="d-flex justify-end">
              <v-btn type="submit" color="primary">Save Changes</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>

      <!-- Menu on right side -->
      <v-col cols="1" class="d-flex align-start justify-end">
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
