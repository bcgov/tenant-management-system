<script setup lang="ts">
import type { Tenant } from '@/models/tenant.model'
import { ref, watch } from 'vue'

const props = defineProps<{
  isEditing: boolean
  tenant?: Tenant
}>()

type EmitFn = (event: 'update', tenant: Partial<Tenant>) => void
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
</script>

<template>
  <v-form @submit.prevent="handleSubmit" v-if="tenant">
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
</template>
