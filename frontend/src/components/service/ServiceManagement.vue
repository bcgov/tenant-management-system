<script setup lang="ts">
import { ref } from 'vue'

import type { Service, Tenant } from '@/models'

// --- Component Interface -----------------------------------------------------

defineProps<{
  services: Service[]
  tenant: Tenant
}>()

// --- Component State ---------------------------------------------------------

const search = ref('')
</script>

<template>
  <v-container class="px-0" fluid>
    <v-row>
      <v-col cols="12">
        <h4 class="mb-6 mt-12">Services</h4>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search"
          variant="outlined"
          clearable
          hide-details
          single-line
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-data-table
          :header-props="{
            class: 'text-body-1 font-weight-bold bg-surface-light',
          }"
          :headers="[
            {
              title: 'Service',
              key: 'name',
              align: 'start',
            },
            {
              title: 'Available Since',
              key: 'createdDate',
              align: 'start',
            },
          ]"
          :items="services"
          :search="search"
          :sort-by="[{ key: 'name' }]"
          item-value="id"
          striped="even"
          fixed-header
          hover
        >
          <template #no-data>
            <v-alert type="info">{{
              search
                ? 'No services match your search criteria'
                : 'No services are currently available'
            }}</v-alert>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
