<script setup lang="ts">
import { mdiClose } from '@mdi/js'
import { computed, ref } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { Role, type RoleId } from '@/models/role.model'
import { type User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'
import { isIdpBceidBusiness } from '@/utils/identityProvider'

// --- Component Interface -----------------------------------------------------

const { roles, user } = defineProps<{
  roles: Role[]
  user: User
}>()

const emit = defineEmits<{
  'roles-changed': [RoleId[], RoleId[]]
  'update:openDialog': [boolean]
}>()

// --- Component State ---------------------------------------------------------

const defaultValues = ref<boolean[]>([])

const dialogVisible = defineModel<boolean>()

const items = ref<
  Array<{ description: string; role: string; roleName: string; value: boolean }>
>([])

// --- Computed Values ---------------------------------------------------------

const atLeastOneRole = computed(() => items.value.some((item) => item.value))

const hasChanges = computed(() =>
  items.value.some((item, i) => item.value !== defaultValues.value[i]),
)

// --- Component Methods -------------------------------------------------------

const handleSave = () => {
  const rolesToAdd: RoleId[] = []
  const rolesToRemove: RoleId[] = []

  items.value.forEach((item, index) => {
    const role = roles.find((r) => r.name === item.roleName)

    if (role === undefined) {
      return
    }

    if (item.value && !defaultValues.value[index]) {
      rolesToAdd.push(role.id)
    }

    if (!item.value && defaultValues.value[index]) {
      rolesToRemove.push(role.id)
    }
  })

  emit('roles-changed', rolesToAdd, rolesToRemove)
  emit('update:openDialog', false)
}

const initializeState = () => {
  items.value = isIdpBceidBusiness(user.ssoUser.idpType)
    ? [
        {
          description: ROLES.SERVICE_USER.description,
          role: ROLES.SERVICE_USER.title,
          roleName: ROLES.SERVICE_USER.value,
          value: user.roles.some(
            (role) => role.name === ROLES.SERVICE_USER.value,
          ),
        },
      ]
    : [
        {
          description: ROLES.TENANT_OWNER.description,
          role: ROLES.TENANT_OWNER.title,
          roleName: ROLES.TENANT_OWNER.value,
          value: user.roles.some(
            (role) => role.name === ROLES.TENANT_OWNER.value,
          ),
        },
        {
          description: ROLES.USER_ADMIN.description,
          role: ROLES.USER_ADMIN.title,
          roleName: ROLES.USER_ADMIN.value,
          value: user.roles.some(
            (role) => role.name === ROLES.USER_ADMIN.value,
          ),
        },
        {
          description: ROLES.SERVICE_USER.description,
          role: ROLES.SERVICE_USER.title,
          roleName: ROLES.SERVICE_USER.value,
          value: user.roles.some(
            (role) => role.name === ROLES.SERVICE_USER.value,
          ),
        },
      ]

  defaultValues.value = items.value.map((item) => item.value)
}

initializeState()
</script>

<template>
  <v-dialog v-model="dialogVisible" height="777px" width="627px" persistent>
    <v-card class="pa-6">
      <v-card-title class="align-center d-flex justify-space-between">
        Edit Tenant Role
        <v-btn
          :icon="mdiClose"
          variant="plain"
          @click="dialogVisible = false"
        ></v-btn>
      </v-card-title>
      <v-card-text>
        <div class="my-4">
          <h3 class="text-bold">{{ user.ssoUser.displayName }}</h3>
        </div>
        <p class="mb-4 text-body-medium">
          Tenant roles define what a user can see and do within a tenant. Each
          role provides a different level of access, from full management to
          limited use.
        </p>
        <p class="mb-12 text-body-medium">
          Below are the available tenant roles you can assign to a user. A
          checkmark shows roles currently assigned to this user. Select
          additional role(s) to update their permissions.
        </p>

        <v-data-table
          :header-props="{
            class: 'bg-surface-light font-weight-bold text-body-medium',
          }"
          :headers="[
            { title: 'Role', value: 'role' },
            { title: 'Description', value: 'description' },
          ]"
          :items="items"
          hide-default-footer
        >
          <template #[`item.role`]="{ item }">
            <v-checkbox
              v-model="item.value"
              :label="item.role"
              class="d-inline-flex normalHeight text-body-medium"
            />
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions class="d-flex justify-end">
        <ButtonSecondary
          class="me-4"
          text="Cancel"
          @click="$emit('update:openDialog', false)"
        />
        <ButtonPrimary
          :disabled="!hasChanges || !atLeastOneRole"
          text="Save roles"
          @click="handleSave"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.normalHeight.v-checkbox .v-label {
  font-family: 'Roboto', sans-serif;
  font-size: 0.875rem !important;
  font-weight: 400;
  letter-spacing: 0.0178571429em !important;
  line-height: 1.5;
}

.normalHeight.v-checkbox .v-selection-control {
  min-height: unset;
}

.normalHeight.v-input--density-default {
  height: 68px;
}
</style>
