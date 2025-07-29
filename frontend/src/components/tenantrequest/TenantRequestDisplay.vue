<script setup lang="ts">
import type { TenantRequest } from '@/models'

defineProps<{
  tenantRequest: TenantRequest
}>()

const emit = defineEmits<{
  back: []
}>()

const handleBack = () => {
  emit('back')
}
</script>

<template>
  <v-container class="pa-6">
    <h4 class="mb-12">Tenant Request: {{ tenantRequest.name }}</h4>

    <v-row>
      <v-col cols="4">
        <v-text-field
          :model-value="tenantRequest.createdBy"
          label="User Name (IDIR)"
          disabled
        />
      </v-col>
      <v-col cols="5">
        <v-text-field
          :model-value="tenantRequest.ministryName"
          label="Ministry/Organization"
          disabled
        />
      </v-col>
      <v-col cols="3">
        <v-text-field
          :model-value="tenantRequest.createdDate"
          label="Date of Request (YYYY-MM-DD)"
          disabled
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-text-field
          :model-value="tenantRequest.name"
          label="Requested Tenant Name"
          disabled
        />
      </v-col>
      <v-col cols="8">
        <v-textarea
          :model-value="tenantRequest.description"
          label="Description of Tenant"
          rows="1"
          auto-grow
          disabled
        ></v-textarea>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12">
        <v-divider class="mb-4" />
        <div class="d-flex justify-start">
          <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            variant="text"
            @click="handleBack"
          >
            Back to All Requests
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
