<script setup lang="ts">
import {
  mdiArrowRightThin,
  mdiBookOpenBlankVariantOutline,
  mdiCheckboxOutline,
  mdiForumOutline,
} from '@mdi/js'
import { computed } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()

// --- Component State ---------------------------------------------------------

const linkContactUs = config.link.contactUs
const linkDocumentation = config.link.documentation
const linkNotify = config.link.notify
const linkSubmit = config.link.submit
const linkWorkflow = config.link.workflow

// --- Computed Values ---------------------------------------------------------

const hintBceidBusiness = computed(() => config.oidc.hintBceidBusiness)
const hintIdir = computed(() => config.oidc.hintIdir)
</script>

<template>
  <v-container>
    <h1>CSTAR User Portal</h1>

    <p>
      Connected Services, Team Access, and Roles (CSTAR) helps ministries
      securely manage access to CHEFS, Workflow, and Notify. It provides a
      simple way to organize users and assign roles across government services.
    </p>

    <v-row density="compact">
      <v-col cols="12" lg="4">
        <v-icon :icon="mdiCheckboxOutline" class="icon-text" color="primary" />
        Control access to digital services
      </v-col>
      <v-col cols="12" lg="4">
        <v-icon :icon="mdiCheckboxOutline" class="icon-text" color="primary" />
        Add users and organize access across teams
      </v-col>
      <v-col cols="12" lg="4">
        <v-icon :icon="mdiCheckboxOutline" class="icon-text" color="primary" />
        Assign roles and permissions
      </v-col>
    </v-row>

    <v-row class="mt-12">
      <v-col class="d-flex" cols="12" lg="5">
        <v-card class="flex-grow-1">
          <v-card-title class="pb-3 pt-6 px-6">
            <h4 class="my-0">Sign in to CSTAR</h4>
          </v-card-title>
          <v-card-text class="px-6 py-3">
            View or manage your tenants, users and access. What you can do
            depends on your assigned role within each tenant. Contact the person
            who manages CSTAR access for your team to change your role. Sign in
            with:
          </v-card-text>
          <v-card-actions class="px-6 py-3">
            <v-row density="comfortable">
              <v-col cols="12" lg="6">
                <ButtonPrimary
                  text="IDIR"
                  block
                  @click="authStore.login({ idpHint: hintIdir })"
                />
              </v-col>
              <v-col cols="12" lg="6">
                <ButtonPrimary
                  text="Business BCeID"
                  block
                  @click="authStore.login({ idpHint: hintBceidBusiness })"
                />
              </v-col>
            </v-row>
          </v-card-actions>
          <v-card-text class="pb-6 pt-3 px-6">
            Having trouble signing in?<br />
            <a :href="linkContactUs" rel="noopener noreferrer" target="_blank">
              Get help signing in
              <v-icon
                :icon="mdiArrowRightThin"
                class="icon-text"
                color="primary"
              />
            </a>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col class="d-flex" cols="12" lg="7">
        <v-card class="flex-grow-1">
          <v-card-title class="pb-3 pt-6 px-6">
            <h4 class="my-0">Get help</h4>
          </v-card-title>
          <v-card-text class="pb-6 pt-3 px-6">
            <p class="mt-0">
              Explore resources to guide you through onboarding and get the most
              out of CSTAR.
            </p>
            <v-row density="comfortable">
              <v-col cols="12" lg="6">
                <v-sheet class="pa-4" color="background">
                  <h5 class="mb-2 mt-0">
                    <v-icon
                      :icon="mdiForumOutline"
                      class="icon-header"
                      color="primary"
                      size="md"
                    />
                    Contact support
                  </h5>
                  Get help from our support teams.<br />
                  <a
                    :href="linkContactUs"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Contact us
                    <v-icon
                      :icon="mdiArrowRightThin"
                      class="icon-text"
                      color="primary"
                    />
                  </a>
                </v-sheet>
              </v-col>
              <v-col cols="12" lg="6">
                <v-sheet class="pa-4" color="background">
                  <h5 class="mb-2 mt-0">
                    <v-icon
                      :icon="mdiBookOpenBlankVariantOutline"
                      class="icon-header"
                      color="primary"
                      size="md"
                    />
                    User guide
                  </h5>
                  Step-by-step instructions for using CSTAR.<br />
                  <a
                    :href="linkDocumentation"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Read the guide
                    <v-icon
                      :icon="mdiArrowRightThin"
                      class="icon-text"
                      color="primary"
                    />
                  </a>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title class="pb-3 pt-6 px-6">
        <h4 class="my-0">Go to a connected service</h4>
      </v-card-title>
      <v-card-text class="pb-6 pt-3 px-6">
        <p class="mt-0">
          Already set up? Go directly to the service you want to use.
        </p>

        <v-row density="comfortable">
          <v-col cols="12" lg="4">
            <v-sheet class="pa-4" color="background">
              <h5 class="mb-2 mt-0">CHEFS</h5>
              Create online forms and manage submissions.<br />
              <a :href="linkSubmit" rel="noopener noreferrer" target="_blank">
                Go to CHEFS
                <v-icon
                  :icon="mdiArrowRightThin"
                  class="icon-text"
                  color="primary"
                />
              </a>
            </v-sheet>
          </v-col>
          <v-col cols="12" lg="4">
            <v-sheet class="pa-4" color="background">
              <h5 class="mb-2 mt-0">Notify</h5>
              Send email, SMS or other messaging notifications.<br />
              <a :href="linkNotify" rel="noopener noreferrer" target="_blank">
                Go to Notify
                <v-icon
                  :icon="mdiArrowRightThin"
                  class="icon-text"
                  color="primary"
                />
              </a>
            </v-sheet>
          </v-col>
          <v-col cols="12" lg="4">
            <v-sheet class="pa-4" color="background">
              <h5 class="mb-2 mt-0">Workflow</h5>
              Build and run business processes.<br />
              <a :href="linkWorkflow" rel="noopener noreferrer" target="_blank">
                Go to Workflow
                <v-icon
                  :icon="mdiArrowRightThin"
                  class="icon-text"
                  color="primary"
                />
              </a>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.icon-text {
  vertical-align: text-bottom;
}

.icon-header {
  vertical-align: baseline;
}
</style>
