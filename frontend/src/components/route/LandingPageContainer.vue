<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { config } from '@/services/config.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { isIdpIdir } from '@/utils/identityProvider'

// --- Store and Composable Setup ----------------------------------------------

const authStore = useAuthStore()
const router = useRouter()

// --- Computed Values ---------------------------------------------------------

const basicBceidHint = computed(() => config.basicBceidBroker)
const businessBceidHint = computed(() => config.businessBceidBroker)
const idirHint = computed(() => config.idirBroker)

// --- Watchers and Effects ----------------------------------------------------

watchEffect(() => {
  if (authStore.isAuthenticated) {
    if (isIdpIdir(authStore.authenticatedUser.ssoUser.idpType)) {
      router.push('/tenants')

      return
    }

    router.push('/bceid')
  }
})
</script>

<template>
  <v-container>
    <h1 class="mb-12 text-center">
      Connected Services, Team Access and Roles (CSTAR)
    </h1>
    <v-row>
      <v-col cols="12" lg="8">
        <p class="mt-0 p-xxlarge">
          CSTAR helps ministries securely
          <strong>manage access to digital services</strong>. It provides a
          simple way to organize users and <strong>assign roles</strong> across
          government.
        </p>

        <v-alert class="my-12" title="Before you begin" type="info">
          Make sure you've been granted access. If unsure, contact your ministry
          administrator.
        </v-alert>

        <h3 class="mb-2 pt-12">Access CSTAR</h3>

        <p class="p-xlarge">Choose your login method:</p>
        <v-row class="pb-12">
          <v-col cols="12" lg="4">
            <v-btn
              color="primary"
              variant="flat"
              block
              @click="authStore.login({ idpHint: idirHint })"
            >
              IDIR
            </v-btn>
          </v-col>
          <v-col cols="12" lg="4">
            <v-btn
              color="primary"
              variant="flat"
              block
              @click="authStore.login({ idpHint: basicBceidHint })"
            >
              Basic BCeID
            </v-btn>
          </v-col>
          <v-col cols="12" lg="4">
            <v-btn
              color="primary"
              variant="flat"
              block
              @click="authStore.login({ idpHint: businessBceidHint })"
            >
              Business BCeID
            </v-btn>
          </v-col>
        </v-row>

        <h4 class="mb-4 mt-12">Need Help?</h4>

        <span class="p-xlarge">
          Contact your ministry administrator or email
          <a href="mailto:minshen.wang@gov.bc.ca">minshen.wang@gov.bc.ca</a>
        </span>
      </v-col>

      <v-col class="mt-12 mt-lg-0" cols="12" lg="3" offset-lg="1">
        <v-card>
          <v-card-title class="bg-surface-light-blue px-8 py-0 text-wrap">
            <h4>What you can do in CSTAR</h4>
          </v-card-title>
          <v-card-text class="p-large px-8">
            <p>
              <strong>Control access to digital services</strong><br />
              Manage who can access your ministry's services.
            </p>

            <p>
              <strong>Add and manage users</strong><br />
              Keep your workspace members up to date.
            </p>

            <p>
              <strong>Assign roles and permissions</strong><br />
              Define what users can see and do.
            </p>

            <p>
              <strong>Support onboarding across teams</strong><br />
              Add users and set up access consistently.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Same size as H5. */
.p-xlarge {
  font-size: 1.25rem;
  line-height: 2.125rem;
}

/* Same size as H4. */
.p-xxlarge {
  font-size: 1.5rem;
  line-height: 2.25rem;
}
</style>
