<script setup lang="ts">
// Import necessary functions and refs from Vue and Pinia
import { storeToRefs } from 'pinia'
import { ref, inject, computed } from 'vue'
import { getUser } from '@/services/keycloak'
import notificationService from '@/services/notification'
import { useTenantStore } from '@/stores/tenants'
import { INJECTION_KEYS, MINISTRIES, ROLES } from '@/utils/constants'
import { v4 as uuidv4 } from 'uuid'

// Define props and emits for the component
const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['close'])

// Initialize the tenants store and inject the notification service
const tenantStore = useTenantStore()
const $error = inject(INJECTION_KEYS.error)!

// Reactive references for form fields and state
const username = ref(getUser().displayName)
const name = ref('')
const ministryName = ref('')
const formValid = ref(false)
const { tenants } = storeToRefs(tenantStore)

// Validation rules for form fields
const rules = {
  required: (value: any) => !!value || 'Required',
}

// Computed property to watch the visibility prop
const visible = computed(() => props.visible)

// Function to add a new tenant
const addTenant = async () => {
  if (formValid.value) {
    try {
      // Create tenant through the store (no direct call to the service)
      await tenantStore.addTenant({
        id: uuidv4(),
        name: name.value,
        ministryName: ministryName.value,
        user: getUser(),
        users: [],
      })
      // Reset form fields after successful creation
      name.value = ''
      ministryName.value = ''
      notificationService.addNotification(
        'New tenancy created successfully',
        'success',
      )
    } catch (error) {
      notificationService.addNotification(
        'Failed to create new tenancy',
        'error',
      )
      $error('Failed to create new tenancy', error)
    } finally {
      emit('close')
    }
  }
}

// Function to close the dialog
const closeDialog = () => {
  emit('close')
}
</script>

<template>
  <v-dialog v-model="visible" max-width="600px">
    <v-card>
      <v-card-title>Create New Tenant</v-card-title>
      <v-card-subtitle>
        <a href="#">Learn more about Multi-Tenancy</a>
        <v-icon color="primary">mdi-information-outline</v-icon>
      </v-card-subtitle>
      <v-card-text>
        <v-form v-model="formValid">
          <v-text-field
            v-model="username"
            label="Tenant Owner/Admin"
            readonly
            disabled
          ></v-text-field>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="name"
                label="Name of Tenant"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="ministryName"
                :items="MINISTRIES"
                label="BC Ministries"
                :rules="[rules.required]"
                placeholder="Select an option..."
                required
              ></v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn variant="text" :disabled="!formValid" @click="addTenant"
          >Finish</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
