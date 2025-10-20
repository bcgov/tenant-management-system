<script setup lang="ts">
//imports
import type { Tenant, User } from '@/models'
import { watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { ROLES } from '@/utils/constants'
import { useTenantStore, useRoleStore } from '@/stores'
import { useNotification } from '@/composables'

//stores
const tenantStore = useTenantStore()
const roleStore = useRoleStore()
const notification = useNotification()

//props and default state
const props = defineProps<{
  userIndex: number | null
  tenant: Tenant | null
}>()

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
const dialogVisible = defineModel<boolean>()

const items = ref<Array<{ role: string; description: string; value: boolean }>>(
  [
    { role: t('roles.owner'), description: t('roles.ownerDesc'), value: false },
    { role: t('roles.admin'), description: t('roles.adminDesc'), value: false },
    { role: t('roles.user'), description: t('roles.userDesc'), value: false },
  ],
)
const defaultValues = ref<Array<boolean>>([false, false, false])

//catch user prop changes and update defaults / state

const updateState = (newUser: User | null) => {
  items.value[0].value = false
  defaultValues.value[0] = false
  items.value[1].value = false
  defaultValues.value[1] = false
  items.value[2].value = false
  defaultValues.value[2] = false
  if (newUser && newUser?.roles) {
    for (const role of newUser.roles) {
      if (role.name === ROLES.TENANT_OWNER.value) {
        items.value[0].value = true
        defaultValues.value[0] = true
      } else if (role.name === ROLES.USER_ADMIN.value) {
        items.value[1].value = true
        defaultValues.value[1] = true
      } else if (role.name === ROLES.SERVICE_USER.value) {
        items.value[2].value = true
        defaultValues.value[2] = true
      }
    }
  }
}

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

//computed
const ROLE_LOOKUP = computed(() => [
  roleStore.roles.find((r) => r.name === ROLES.TENANT_OWNER.value),
  roleStore.roles.find((r) => r.name === ROLES.USER_ADMIN.value),
  roleStore.roles.find((r) => r.name === ROLES.SERVICE_USER.value),
])

// watch state for changes based on default values
const hasChanges = computed(() => {
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].value !== defaultValues.value[i]) {
      return true
    }
  }
  return false
})

const atLeastOneRole = computed(() => {
  for (const item of items.value) {
    if (item.value) {
      return true
    }
  }
  return false
})

// emit when dialog is closed/opened
const emit = defineEmits(['update:openDialog'])

//headers for the table
const headers = [
  { title: t('roles.role', 1), value: 'role' },
  { title: t('general.description'), value: 'description' },
]

//save method
const handleSave = async () => {
  const roleIds = []
  const fullRoleIds = []
  const removeIds = []
  //built array of roles to add/remove
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].value) {
      if (!defaultValues.value[i]) {
        roleIds.push(ROLE_LOOKUP.value[i].id)
      }
      fullRoleIds.push(ROLE_LOOKUP.value[i].id)
    } else if (defaultValues.value[i]) {
      removeIds.push(ROLE_LOOKUP.value[i].id)
    }
  }
  try {
    //add first because remove fails if last role
    if (roleIds.length > 0) {
      await tenantStore.assignTenantUserRoles(
        props.tenant,
        user?.value?.id,
        fullRoleIds,
      )
    }
    //remove any that aren't added
    if (removeIds.length > 0) {
      for (const removeId of removeIds) {
        await tenantStore.removeTenantUserRole(
          props.tenant,
          user?.value?.id,
          removeId,
        )
      }
    }
    //success, show notification toast
    notification.success(t('roles.updateSuccess'))
    emit('update:openDialog', false)
  } catch (error) {
    // show the best possible error message in error case
    const msg =
      error.response?.data?.details?.body?.[0]?.message ||
      error.response?.data?.message ||
      error.message
    notification.error(`${t('roles.updateError')} ${msg}`)
    console.error('Error updating roles:', error)
  }
}
</script>

<template>
  <v-dialog
    :model-value="dialogVisible"
    height="600px"
    width="550px"
    persistent
  >
    <v-card class="px-5 py-10">
      <v-card-title class="mb-4">
        <v-row justify="end">
          <v-btn variant="plain" @click="$emit('update:openDialog', false)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-row>
        <v-row> {{ $t('tenants.tenant', 1) }} {{ $t('roles.role', 1) }} </v-row>
      </v-card-title>
      <v-card-text class="pa-0">
        <p class="mb-4">
          <a href=""
            >{{ $t('tenants.learnMore') }} {{ $t('tenants.tenant', 1) }}
            {{ $t('roles.role', 2) }}</a
          >
        </p>
        <p class="text-body-2 mb-12">
          {{ $t('tenants.roleAssignDesc') }}
        </p>
        <v-data-table
          :header-props="{
            class: 'text-body-2 font-weight-bold bg-surface-light',
          }"
          :headers="headers"
          :items="items"
          hide-default-footer
        >
          <template #[`item.role`]="{ item }">
            <v-checkbox
              v-model="item.value"
              :label="item.role"
              class="text-body-2 d-inline-flex normalHeight"
            />
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn
          :text="$t('general.cancel')"
          variant="text"
          @click="$emit('update:openDialog', false)"
        />
        <v-btn
          :disabled="!hasChanges || !atLeastOneRole"
          :text="$t('general.save')"
          color="primary"
          variant="flat"
          @click="handleSave"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.normalHeight.v-checkbox .v-selection-control {
  min-height: unset;
}

.normalHeight.v-input--density-default {
  height: 68px;
}

.normalHeight.v-checkbox .v-label {
  font-size: 0.875rem !important;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.0178571429em !important;
  font-family: 'Roboto', sans-serif;
  text-transform: none !important;
}
</style>
