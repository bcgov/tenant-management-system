import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  createTenancy,
  getUserTenancies,
  getUsers,
  getUserRoles,
} from '@/services/tenancyService'
import type { Role } from '@/types/Role'
import { Tenancy } from '@/models/tenancy.model'
import type { User } from '@/types/User'

export const useTenanciesStore = defineStore('tenancies', () => {
  const tenancies = ref<Tenancy[]>([])
  const tenancyUsers = ref<Record<string, User[]>>({})
  const tenancyUserRoles = ref<Record<string, Record<string, Role[]>>>({})

  const loading = ref(false)

  // Fetch all tenancies for a user
  const fetchTenancies = async (userId: string) => {
    loading.value = true
    try {
      const tenancyList = await getUserTenancies(userId)
      const tenancyInstances = await Promise.all(
        tenancyList.map(async (tenancy) => {
          const users = await getUsers(tenancy.id)

          await Promise.all(
            users.map(async (user) => {
              user.roles = await getUserRoles(tenancy.id, user.id)
            }),
          )

          return new Tenancy(
            tenancy.id,
            tenancy.name,
            tenancy.ministryName,
            users,
          )
        }),
      )

      tenancies.value = tenancyInstances
    } finally {
      loading.value = false
    }
  }

  // Fetch users for a specific tenancy
  const fetchTenancyUsers = async (tenancyId: string) => {
    const users = await getUsers(tenancyId)
    tenancyUsers.value[tenancyId] = users
  }

  // Fetch roles for a specific user in a tenancy
  const fetchTenancyUserRoles = async (tenancyId: string, userId: string) => {
    const roles = await getUserRoles(tenancyId, userId)
    if (!tenancyUserRoles.value[tenancyId]) {
      tenancyUserRoles.value[tenancyId] = {}
    }
    tenancyUserRoles.value[tenancyId][userId] = roles
  }

  // Add a new tenancy
  const addTenancy = async (tenancy: Tenancy) => {
    const newTenancy = await createTenancy(tenancy)
    tenancies.value.push(newTenancy)
  }

  return {
    addTenancy,
    fetchTenancies,
    fetchTenancyUsers,
    fetchTenancyUserRoles,
    loading,
    tenancies,
    tenancyUserRoles,
    tenancyUsers,
  }
})
