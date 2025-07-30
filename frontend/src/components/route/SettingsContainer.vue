<script setup lang="ts">
import { ref } from 'vue'

import AdministratorContainer from '@/components/auth/AdministratorContainer.vue'
import LoginContainer from '@/components/auth/LoginContainer.vue'
import TenantRequestContainer from '@/components/tenantrequest/TenantRequestContainer.vue'

const tab = ref<number>(0)
</script>

<template>
  <LoginContainer>
    <AdministratorContainer>
      <v-card elevation="0">
        <v-tabs v-model="tab" :mandatory="false">
          <!-- The v-tabs component insists on always having an active tab. Use
           an invisible Tab 0 to make v-tabs happy. -->
          <v-tab :value="0" class="pa-0 ma-0" style="min-width: 0px" />
          <v-tab :value="1">Tenant Requests</v-tab>
          <v-tab :value="2">Shared Services</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0" />

          <v-window-item :value="1">
            <TenantRequestContainer />
          </v-window-item>

          <v-window-item :value="2">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <p>Content for Shared Services tab</p>
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card>
    </AdministratorContainer>
  </LoginContainer>
</template>
