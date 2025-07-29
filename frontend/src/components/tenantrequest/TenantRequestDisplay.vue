<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import type { TenantRequest } from '@/models'
import { MINISTRIES } from '@/utils/constants'

const props = defineProps<{
  tenantRequest: TenantRequest
}>()
</script>

<template>
  <v-container class="pa-6">
    <h4>Tenant Request: {{ tenantRequest.name }}</h4>

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="tenantRequest.name"
          label="Name of Tenant"
          required
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="tenantRequest.ministryName"
          label="Ministry/Organization"
          placeholder="Select an option..."
          required
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <v-textarea
          v-model="tenantRequest.description"
          label="Description of Tenant"
          rows="1"
          auto-grow
          required
        ></v-textarea>
      </v-col>
    </v-row>
  </v-container>
</template>
