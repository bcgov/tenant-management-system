<script setup lang="ts">
import { mdiClose } from '@mdi/js'
import { watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ButtonPrimary from '@/components/ui/ButtonPrimary.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { useNotification } from '@/composables/useNotification'
import { type RoleId } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { type User, type UserId } from '@/models/user.model'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { ROLES } from '@/utils/constants'

const { t } = useI18n()

// TODO: non-container components should not directly use stores - they should
// emit events and let the parent container handle the store interactions.
// Refactor this component to follow that pattern.
const tenantStore = useTenantStore()
const roleStore = useRoleStore()
const notification = useNotification()

// --- Component Interface -----------------------------------------------------

const props = defineProps<{
  tenant: Tenant | null
  userIndex: number | null
}>()

const emit = defineEmits(['update:openDialog'])

// --- Component State ---------------------------------------------------------

const defaultValues = ref<Array<boolean>>([false, false, false])

const dialogVisible = defineModel<boolean>()

const isBCeIDUser = ref<boolean>(false)

const items = ref<Array<{ role: string; description: string; value: boolean }>>(
  isBCeIDUser.value
    ? [
        {
          role: t('roles.serviceUser'),
          description: t('roles.serviceUserDesc'),
          value: false,
        },
      ]
    : [
        {
          role: t('roles.owner'),
          description: t('roles.ownerDesc'),
          value: false,
        },
        {
          role: t('roles.admin'),
          description: t('roles.adminDesc'),
          value: false,
        },
        {
          role: t('roles.user'),
          description: t('roles.userDesc'),
          value: false,
        },
      ],
)

// --- Watchers and Effects ----------------------------------------------------

watch(
  () => props.userIndex,
  (newIndex) => {
    if (
      props.tenant &&
      newIndex !== null &&
      newIndex >= 0 &&
      newIndex < props.tenant.users.length
    ) {
      const newUser = props.tenant.users[newIndex]
      updateState(newUser)
    }
  },
)

// --- Computed Values ---------------------------------------------------------

const atLeastOneRole = computed(() => {
  for (const item of items.value) {
    if (item.value) {
      return true
    }
  }

  return false
})

// watch state for changes based on default values
const hasChanges = computed(() => {
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].value !== defaultValues.value[i]) {
      return true
    }
  }

  return false
})

const roleLookup = computed(() => [
  roleStore.roles.find((r) => r.name === ROLES.TENANT_OWNER.value),
  roleStore.roles.find((r) => r.name === ROLES.USER_ADMIN.value),
  roleStore.roles.find((r) => r.name === ROLES.SERVICE_USER.value),
])

const user = computed<User | null>(() => {
  if (
    props.tenant &&
    props.userIndex !== null &&
    props.userIndex >= 0 &&
    props.userIndex < props.tenant.users.length
  ) {
    const newUser = props.tenant.users[props.userIndex]
    updateState(newUser)

    return newUser
  }

  return null
})

// --- Component Methods -------------------------------------------------------

const handleSave = async () => {
  const roleIds = []
  const fullRoleIds = []
  const removeIds = []

  //built array of roles to add/remove
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].value) {
      fullRoleIds.push(roleLookup.value?.[i]?.id as string)
      if (!defaultValues.value[i]) {
        roleIds.push(roleLookup.value?.[i]?.id as string)
      }
    } else if (!items.value[i].value && defaultValues.value[i]) {
      if (roleLookup?.value?.[i]?.id !== undefined) {
        removeIds.push(roleLookup.value?.[i]?.id as string)
      }
    }
  }

  try {
    //add first because remove fails if last role
    if (roleIds.length > 0) {
      // TODO
      await tenantStore.assignTenantUserRoles(
        props.tenant as Tenant,
        user?.value?.id as UserId,
        roleIds as RoleId[],
        fullRoleIds,
      )
    }

    //remove any that aren't added
    if (removeIds.length > 0) {
      for (const removeId of removeIds) {
        // TODO
        await tenantStore.removeTenantUserRole(
          props.tenant as Tenant,
          user?.value?.id as UserId,
          removeId as RoleId,
        )
      }
    }

    //success, show notification toast
    notification.success(t('roles.updateSuccess'))
    emit('update:openDialog', false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // show the best possible error message in error case
    const msg =
      error.response?.data?.details?.body?.[0]?.message ||
      error.response?.data?.message ||
      error.message
    notification.error(`${t('roles.updateError')} ${msg}`)
    console.error('Error updating roles:', error)
  }
}

const updateState = (newUser: User | null) => {
  isBCeIDUser.value = false
  defaultValues.value = []
  if (newUser && newUser?.ssoUser && newUser?.ssoUser?.idpType) {
    isBCeIDUser.value = newUser.ssoUser.idpType.toLowerCase().includes('bceid')
  }

  items.value = isBCeIDUser.value
    ? [
        {
          role: t('roles.user'),
          description: t('roles.userDesc'),
          value: false,
        },
      ]
    : [
        {
          role: t('roles.owner'),
          description: t('roles.ownerDesc'),
          value: false,
        },
        {
          role: t('roles.admin'),
          description: t('roles.adminDesc'),
          value: false,
        },
        {
          role: t('roles.user'),
          description: t('roles.userDesc'),
          value: false,
        },
      ]
  items.value[0].value = false
  defaultValues.value[0] = false

  if (items.value.length > 2) {
    items.value[1].value = false
    defaultValues.value[1] = false
    items.value[2].value = false
    defaultValues.value[2] = false
  }

  if (newUser && newUser?.roles) {
    for (const role of newUser.roles) {
      if (role.name === ROLES.TENANT_OWNER.value && !isBCeIDUser.value) {
        items.value[0].value = true
        defaultValues.value[0] = true
      } else if (role.name === ROLES.USER_ADMIN.value && !isBCeIDUser.value) {
        items.value[1].value = true
        defaultValues.value[1] = true
      } else if (role.name === ROLES.SERVICE_USER.value) {
        const ind = isBCeIDUser.value ? 0 : 2
        items.value[ind].value = true
        defaultValues.value[ind] = true
      }
    }
  }
}
</script>

<template>
  <v-dialog v-model="dialogVisible" height="777px" width="627px" persistent>
    <v-card class="pa-6">
      <v-card-title class="align-center d-flex justify-space-between">
        {{ $t('general.edit') }} {{ $t('tenants.tenant', 1) }}
        {{ $t('roles.role', 1) }}
        <v-btn
          :icon="mdiClose"
          variant="plain"
          @click="dialogVisible = false"
        ></v-btn>
      </v-card-title>
      <v-card-text>
        <div class="my-4">
          <h3 class="text-bold">{{ user?.ssoUser.displayName }}</h3>
        </div>
        <p class="mb-4 text-body-medium">
          {{ $t('tenants.learnMore') }}
        </p>
        <p class="mb-12 text-body-medium">
          {{ $t('tenants.roleAssignDesc') }}
        </p>

        <v-data-table
          :header-props="{
            class: 'bg-surface-light font-weight-bold text-body-medium',
          }"
          :headers="[
            { title: t('roles.role', 1), value: 'role' },
            { title: t('general.description'), value: 'description' },
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
          :text="$t('general.cancel')"
          class="me-4"
          @click="$emit('update:openDialog', false)"
        />
        <ButtonPrimary
          :disabled="!hasChanges || !atLeastOneRole"
          :text="$t('general.save')"
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
