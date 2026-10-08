<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

const dialogVisible = defineModel<boolean>()

const emit = defineEmits<{
  'roles-changed': [User, RoleId[], RoleId[]]
}>()

// --- Component State ---------------------------------------------------------

const items = ref<
  Array<{
    description: string
    role: string
    roleName: string
    value: boolean
    valueInitial: boolean
  }>
>([])

// --- Watchers and Effects ----------------------------------------------------

const toItem = (role: {
  description: string
  title: string
  value: string
}) => {
  const assigned = user.roles.some((r) => r.name === role.value)

  return {
    description: role.description,
    role: role.title,
    roleName: role.value,
    value: assigned,
    valueInitial: assigned,
  }
}

watch(
  dialogVisible,
  (visible) => {
    if (visible) {
      const availableRoles = isIdpBceidBusiness(user.ssoUser.idpType)
        ? [ROLES.SERVICE_USER]
        : [ROLES.TENANT_OWNER, ROLES.USER_ADMIN, ROLES.SERVICE_USER]

      items.value = availableRoles.map(toItem)
    }
  },
  { immediate: true },
)

// --- Computed Values ---------------------------------------------------------

const atLeastOneRole = computed(() => items.value.some((item) => item.value))

const hasChanges = computed(() =>
  items.value.some((item) => item.value !== item.valueInitial),
)

// --- Component Methods -------------------------------------------------------

const handleSave = () => {
  const rolesToAdd: RoleId[] = []
  const rolesToRemove: RoleId[] = []

  for (const item of items.value) {
    if (item.value === item.valueInitial) {
      continue
    }

    const role = roles.find((r) => r.name === item.roleName)
    if (!role) {
      continue
    }

    if (item.value) {
      rolesToAdd.push(role.id)
    } else {
      rolesToRemove.push(role.id)
    }
  }

  dialogVisible.value = false
  emit('roles-changed', user, rolesToAdd, rolesToRemove)
}
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="627" scrollable>
    <v-card class="pa-6">
      <v-card-title class="d-flex align-center justify-space-between">
        Edit tenant roles
      </v-card-title>

      <v-card-text>
        <h3 class="my-4 font-weight-bold">{{ user.ssoUser.displayName }}</h3>
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
            <v-checkbox v-model="item.value" density="compact" hide-details>
              <template #label>
                <span class="text-body-medium">{{ item.role }}</span>
              </template>
            </v-checkbox>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions class="justify-end">
        <ButtonSecondary
          class="me-4"
          text="Cancel"
          @click="dialogVisible = false"
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
