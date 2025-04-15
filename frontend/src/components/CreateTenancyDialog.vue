<script setup lang="ts">
// Import necessary functions and refs from Vue and Pinia
import { storeToRefs } from 'pinia'
import { ref, inject, computed } from 'vue'
import { getUser } from '@/services/keycloak'
import notificationService from '@/services/notification'
import { createTenancy } from '@/services/tenantService'
import { useTenanciesStore } from '@/stores/tenancies'
import { INJECTION_KEYS, MINISTRIES, ROLES } from '@/utils/constants'
import { v4 as uuidv4 } from 'uuid'

// Define props and emits for the component
const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['close'])

// Initialize the tenancies store and inject the notification service
const tenanciesStore = useTenanciesStore()
const $error = inject(INJECTION_KEYS.error)!

// Reactive references for form fields and state
const username = ref(getUser().displayName)
const name = ref('')
const ministryName = ref('')
const formValid = ref(false)
const { tenancies } = storeToRefs(tenanciesStore)

// Validation rules for form fields
const rules = {
  required: (value: any) => !!value || 'Required',
}

// Computed property to watch the visibility prop
const visible = computed(() => props.visible)

// Function to add a new tenancy
const addTenancy = async () => {
  if (formValid.value) {
    try {
      let response = await createTenancy({
        id: uuidv4(),
        name: name.value,
        ministryName: ministryName.value,
        user: getUser(),
        users: []
      })
      name.value = ''
      ministryName.value = ''
      response.users[0].roles = [{ name: ROLES.ADMIN }]
      tenancies.value.push(response)
      notificationService.addNotification('New tenancy created successfully', 'success')
    } catch (error) {
      notificationService.addNotification('Failed to create new tenancy', 'error')
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
      <v-card-title> Create New Tenancy </v-card-title>
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
                label="Name of Tenancy"
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
        <v-btn variant="text" :disabled="!formValid" @click="addTenancy">Finish</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
