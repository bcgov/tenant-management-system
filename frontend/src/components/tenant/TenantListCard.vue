<script setup lang="ts">
import { computed } from 'vue'

import { useNotification } from '@/composables'
import type { Tenant } from '@/models'

const { tenant } = defineProps<{
  tenant: Tenant
}>()

/**
 * SonarQube rule S6598 triggers when there is a single emitter, and it suggests
 * using function type syntax rather than call signature syntax. However, the
 * Vue standard is to use call signature syntax. This intentional deviation from
 * the SonarQube rule is to be compatible with Vue's recommendation.
 *
 * @see https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits
 */
const emit = defineEmits<{
  (event: 'click'): void // NOSONAR: S6598
}>()

const { addNotification } = useNotification()

const firstOwner = computed(() => {
  const owners = tenant.getOwners()
  if (!owners.length) {
    addNotification(
      `Critical: Tenant "${tenant.name}" has no owners assigned`,
      'error',
    )

    return null
  }

  return owners[0]
})
</script>

<template>
  <v-card class="hoverable bg-grey-lighten-4" @click="emit('click')">
    <v-card-title>
      <span class="card-link">
        {{ tenant.name }}
      </span>
    </v-card-title>
    <v-card-subtitle>{{ tenant.ministryName }}</v-card-subtitle>
    <v-card-text v-if="firstOwner">
      <p>Tenant Owner: {{ firstOwner.displayName }}</p>
      <p>{{ firstOwner.email }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.card-link {
  color: #1a73e8;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

.card-link:hover {
  color: #1558b0;
}
</style>
