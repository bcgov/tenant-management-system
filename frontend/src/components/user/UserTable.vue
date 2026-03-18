<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { User, Tenant, Role, GroupUser } from '@/models'
import type { ItemSlotBase } from 'vuetify/lib/components/VDataTable/types.mjs'

import { convertIDPToDisplay } from '@/utils/display'
import { currentUserHasRole } from '@/utils/permissions'
import { ROLES } from '@/utils/constants'

type RowPropsType = ItemSlotBase<User>

const props = defineProps<{
  users: Array<User> | Array<GroupUser>
  where: string
  filter?: string
  tenant: Tenant
  handleRemoveRole?: (user: User, role: Role) => void
  showOffboardDialog?: (user: User) => void
  showActions?: boolean
  showAdd?: boolean
  showRoles?: boolean
  enableSelect?: boolean
  selectUser?: (e: Event | null, r: RowPropsType) => void
  sortBy?: Array<{ key: string; order?: 'asc' | 'desc' }>
}>()

const emit = defineEmits<{
  (event: 'add-clicked', user: User): void
  (event: 'add-first-clicked'): void
}>()

const { t } = useI18n()

const computedUsers = computed((): User[] => {
  const u = props.users
  if (!Array.isArray(u)) return []
  if (u.length === 0) return []
  const first = u[0]
  // If items look like GroupUser (have a `user` property), map to the inner User
  if ((first as GroupUser).user !== undefined) {
    return (u as GroupUser[]).map((g) => g.user)
  }
  return u as User[]
})

const selectedUser = ref<User | null>(null)

const isUserAdmin = computed(() => {
  // A tenant owner, by default, is also a user admin - even if they don't have
  // the USER_ADMIN role.
  return (
    currentUserHasRole(props.tenant, ROLES.TENANT_OWNER.value) ||
    currentUserHasRole(props.tenant, ROLES.USER_ADMIN.value)
  )
})

const moreThanOneTenantOwner = computed(() => {
  const owners = props.tenant.getOwners()
  return owners.length > 1
})

const headerClass = 'text-body-1 font-weight-bold bg-surface-light'

const sortKey = computed(() => {
  if (props.sortBy && props.sortBy.length > 0) {
    return props.sortBy
  }
  return [{ key: 'ssoUser.firstName' }]
})

type TableHeaderItem = {
  title: string
  key: string
  align?: 'start' | 'center' | 'end'
  sortable?: boolean
}

const headers: ComputedRef<TableHeaderItem[]> = computed(() => {
  const rv: TableHeaderItem[] = [
    {
      title: t('users.firstName'),
      key: 'ssoUser.firstName',
      align: 'start',
      sortable: true,
    },
    {
      title: t('users.lastName'),
      key: 'ssoUser.lastName',
      align: 'start',
      sortable: true,
    },
    {
      title: t('users.email'),
      key: 'ssoUser.email',
      align: 'start',
      sortable: true,
    },
    {
      title: t('users.idpType'),
      key: 'ssoUser.idpType',
      align: 'start',
      sortable: false,
    },
  ]
  if (props.showRoles) {
    rv.push({
      title: t('users.tenantRoles'),
      key: 'roles',
      sortable: false,
      align: 'start',
    })
  }

  if (props.showActions) {
    rv.push({
      title: t('users.actions'),
      key: 'actions',
      sortable: false,
      align: 'center',
    })
  }

  if (props.showAdd) {
    rv.push({
      title: t('users.addUser'),
      key: 'add',
      sortable: false,
      align: 'center',
    })
  }

  return rv
})

const canRemoveRole = function (item: User, role: Role): boolean {
  if (item.roles.length <= 1) {
    return false
  }

  if (!isUserAdmin.value) {
    return false
  }

  if (!props.handleRemoveRole) {
    return false
  }
  if (role.name !== ROLES.TENANT_OWNER.value) {
    return true
  }
  // For tenant owners, only allow role removal if there is more than one tenant owner
  return moreThanOneTenantOwner.value
}

const actionItems = computed(() => {
  const rv = []
  if (isUserAdmin.value && props.showOffboardDialog) {
    rv.push({
      title: t('users.offboardUserAction'),
      action: props.showOffboardDialog,
      disabledCondition: (item: User) => {
        return !(
          moreThanOneTenantOwner.value ||
          !item.roles.some((r: Role) => r.name === ROLES.TENANT_OWNER.value)
        )
      },
    })
  }
  return rv
})

const colorRowItem = (item: ItemSlotBase<User>) => {
  const selectedId = selectedUser.value?.id

  if (selectedId && item?.item?.id && selectedId === item.item.id) {
    return { class: 'selected-user' }
  }

  return {}
}
</script>

<template>
  <v-data-table
    v-model="selectedUser"
    :header-props="{
      class: headerClass,
    }"
    :headers="headers"
    :hide-default-footer="computedUsers.length === 0"
    :items="computedUsers"
    :row-props="colorRowItem"
    :search="filter"
    :sort-by="sortKey"
    item-value="id"
    select-strategy="single"
    striped="even"
    fixed-header
    hover
    return-object
    @click:row="
      (e: Event, r: RowPropsType) => enableSelect && selectUser?.(e, r)
    "
  >
    <template #no-data>
      <div>
        <h3 v-if="!showAdd" class="my-4">
          {{ $t('users.noUsersYet', { where }) }}
        </h3>
        <p>
          {{ filter ? $t('users.noMatch') : $t('users.noUsersIn', { where }) }}
        </p>
        <v-btn
          v-if="!showAdd && isUserAdmin"
          class="mt-4"
          color="primary"
          variant="text"
          @click="emit('add-first-clicked')"
        >
          <v-icon
            class="mr-2"
            icon="mdi-plus-box"
            size="x-large"
            style="transform: scale(1.5)"
            left
          />
          {{ $t('users.noUsersAdd', { where }) }}
        </v-btn>
      </div>
    </template>
    <template #[`item.roles`]="{ item }">
      <div class="d-flex flex-wrap" style="gap: 8px; margin-block: 4px">
        <v-chip
          v-for="role in item.roles"
          :key="role.id"
          class="d-inline-flex align-center"
          color="primary"
        >
          {{ role.description }}
          <v-icon
            v-if="canRemoveRole(item, role) && handleRemoveRole"
            class="ml-1 cursor-pointer"
            icon="mdi-close"
            size="small"
            @click.stop="handleRemoveRole(item, role)"
          />
        </v-chip>
      </div>
    </template>

    <template #[`item.ssoUser.idpType`]="{ item }">
      {{ convertIDPToDisplay(item.ssoUser.idpType) }}
    </template>

    <template #[`item.add`]="{ item }">
      <v-btn
        class="pa-0 ma-0"
        color="primary"
        density="compact"
        icon="mdi-plus-box"
        size="x-large"
        variant="text"
        @click="emit('add-clicked', item)"
      />
    </template>

    <template #[`item.actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: activatorProps }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            v-bind="activatorProps"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="(actionItem, i) in actionItems"
            :key="i"
            :value="i"
          >
            <!--
                  Disable the action when `actionItem.enabledCondition(item)` is false.
                  When disabled, show a tooltip explaining why and prevent clicks.
                -->
            <template v-if="actionItem.disabledCondition(item)">
              <v-tooltip location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-list-item-title
                    v-bind="tooltipProps"
                    class="text-body-2 text-disabled cursor-default"
                  >
                    {{ actionItem.title }}
                  </v-list-item-title>
                </template>
                <span>{{ $t('users.actionDisabledTooltip') }}</span>
              </v-tooltip>
            </template>
            <template v-else>
              <v-list-item-title
                @click="actionItem.action && actionItem.action(item)"
                >{{ actionItem.title }}</v-list-item-title
              >
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>
</template>
