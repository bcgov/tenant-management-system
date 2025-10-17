<script setup lang="ts">
import type { Tenant, User } from '@/models';
import { watch, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n() 
import { ROLES } from '@/utils/constants';
import { useTenantStore, useRoleStore } from '@/stores'
import { useNotification } from '@/composables'

const tenantStore = useTenantStore();
const roleStore = useRoleStore();
const notification = useNotification()

const items = ref<Array<{ role: string; description: string; value: boolean }>>([
  { role: t('roles.owner'), description: t('roles.ownerDesc'), value: false },
  { role: t('roles.admin'), description: t('roles.adminDesc'), value: false },
  { role: t('roles.user'), description: t('roles.userDesc'), value: false },
]);
const defaultValues = ref<Array<boolean>>([false, false, false]);
const ROLE_LOOKUP = computed(() => [
  roleStore.roles.find(r => r.name === ROLES.TENANT_OWNER.value)!,
  roleStore.roles.find(r => r.name === ROLES.USER_ADMIN.value)!,
  roleStore.roles.find(r => r.name === ROLES.SERVICE_USER.value)!
])

const useRemoveInstead = computed(() =>
  defaultValues.value.findIndex(v => v === false) === -1
)


const props = defineProps<{
  user: User | null
  tenant: Tenant | null
}>()

watch(
  () => props.user,
  (newUser) => {
    items.value[0].value = false
    defaultValues.value[0] = false
    items.value[1].value = false
    defaultValues.value[1] = false
    items.value[2].value = false
    defaultValues.value[2] = false
    if (newUser && newUser!.roles) {
      for (const role of newUser!.roles) {
        if (role.name === ROLES.TENANT_OWNER.value) {
          items.value[0].value = true
          defaultValues.value[0] = true
        } else if (role.name === ROLES.USER_ADMIN.value) {
          items.value[1].value = true
          defaultValues.value[1] = true
        }else if (role.name === ROLES.SERVICE_USER.value) {
          items.value[2].value = true
          defaultValues.value[2] = true
        }
      }
    }
  },
)

const dialogVisible = defineModel<boolean>()

const hasChanges = computed(() => {
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].value !== defaultValues.value[i]) {
      return true
    }
  }
  return false
})

const emit = defineEmits<{
  (e: 'update:openDialog', value: boolean): void
}>()
const headers = [
  { title: t('roles.role', 1), value: 'role' },
  { title: t('general.description'), value: 'description' },
]

const handleSave = async() => {
  let roleIds = []
  let removeIds = []
  for (let i = 0; i<items.value.length; i++) {
    if (items.value[i].value) {
      roleIds.push(ROLE_LOOKUP.value[i].id)
    } else {
      removeIds.push(ROLE_LOOKUP.value[i].id)
    }
  }
  try {
    if (!useRemoveInstead.value) {
      await tenantStore.assignTenantUserRoles(props.tenant!, props.user!.id, roleIds)
    } else {
      for (let i = 0; i<removeIds.length; i++){
        await tenantStore.removeTenantUserRole(props.tenant!, props.user!.id, removeIds[i])
      }
    }
    notification.success(t('roles.updateSuccess'))
    emit('update:openDialog', false)
  } catch (error) {
    const msg = error.response?.data?.details?.body?.[0]?.message || error.response?.data?.message || error.message
    notification.error(`${t('roles.updateError')} ${msg}`)
    console.error('Error updating roles:', error)
  }
}

</script>

<template>
  <v-dialog
    :model-value="dialogVisible"
    width="550px"
    height="600px"
    persistent>
    <v-card class="px-5 py-10">
      <v-card-title class="mb-4">
        <v-row justify="end">
          <v-btn variant="plain" @click="$emit('update:openDialog', false)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-row>
        <v-row>
        {{ $t('tenants.tenant', 1) }} {{ $t('roles.role', 1) }}
        </v-row>
      </v-card-title>
      <v-card-text class="pa-0">
        <p class="mb-4">
          <a href="">{{ $t('tenants.learnMore') }} {{ $t('tenants.tenant', 1) }} {{ $t('roles.role', 2) }}</a>
        </p>
        <p class="text-body-2 mb-12">
          {{ $t('tenants.roleAssignDesc') }}
        </p>
        <v-data-table
          hide-default-footer
          :header-props="{
            class: 'text-body-2 font-weight-bold bg-surface-light',
          }"
          :headers="headers"
          :items="items"
        >
          <template #[`item.role`]="{ item }">
              <v-checkbox
                v-model="item.value"
                class="text-body-2 d-inline-flex normalHeight"
                :label="item.role"/>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn
          variant="text"
          :text="$t('general.cancel')"
          @click="$emit('update:openDialog', false)"
        />
        <v-btn
          color="primary"
          :disabled="!hasChanges"
          variant="flat"
          :text="$t('general.save')"
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

.normalHeight.v-checkbox .v-label{
  font-size: 0.875rem !important;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.0178571429em !important;
  font-family: "Roboto", sans-serif;
  text-transform: none !important;
}
</style>