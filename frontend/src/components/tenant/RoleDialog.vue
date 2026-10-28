<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { Role, type RoleId } from '@/models/role.model'
import { type User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'
import {
  identityProviderToDisplay,
  isIdpBceidBusiness,
} from '@/utils/identityProvider'

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

const userIdP = computed(() => identityProviderToDisplay(user.ssoUser.idpType))

const userName = computed(() => user.getName())

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
    <v-card color="background">
      <v-card-title class="align-center d-flex justify-space-between pa-6">
        Edit tenant roles
      </v-card-title>

      <v-card-text class="px-6 py-0">
        <p class="p-label my-0">User</p>
        <p class="mt-0">
          <strong>{{ userName }} ({{ userIdP }})</strong>
        </p>

        <p class="mb-4 text-body-medium">
          Select the tenant roles this user should have.
        </p>

        <v-data-table
          :header-props="{ class: 'bg-surface-light font-weight-bold' }"
          :headers="[
            { title: '', value: 'selected', sortable: false, width: '60px' },
            { title: 'Role', value: 'role' },
            { title: 'Description', value: 'description' },
          ]"
          :items="items"
          hide-default-footer
        >
          <template #[`header.selected`]>
            <v-checkbox
              :indeterminate="
                items.some((item) => item.value) &&
                !items.every((item) => item.value)
              "
              :model-value="items.every((item) => item.value)"
              aria-label="Select all roles"
              density="compact"
              hide-details
              @update:model-value="
                (value) => {
                  items.forEach((item) => {
                    item.value = !!value
                  })
                }
              "
            />
          </template>

          <template #[`item.selected`]="{ item }">
            <v-checkbox
              v-model="item.value"
              :aria-label="`${item.role} role`"
              density="compact"
              hide-details
            />
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions class="justify-end pa-6">
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
