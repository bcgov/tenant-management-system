<script setup lang="ts">
import { ref } from 'vue'

import AdministratorContainer from '@/components/auth/AdministratorContainer.vue'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantRequestContainer from '@/components/tenantrequest/TenantRequestContainer.vue'

// --- Component State ---------------------------------------------------------

const tab = ref<number>(0)
</script>

<template>
  <LoginContainer>
    <AdministratorContainer>
      <v-card elevation="0">
        <v-tabs v-model="tab" :mandatory="false">
          <v-tab :value="0">Tenant Requests</v-tab>
          <v-tab :value="1">{{ $t('general.servicesLabel', 2) }}</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0">
            <TenantRequestContainer />
          </v-window-item>

          <v-window-item :value="1">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for {{ $t('general.servicesLabel', 2) }} tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card>
    </AdministratorContainer>
  </LoginContainer>
</template>
