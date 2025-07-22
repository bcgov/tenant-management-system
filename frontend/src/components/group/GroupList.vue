<script setup lang="ts">
import GroupListCard from '@/components/group/GroupListCard.vue'
import type { Group } from '@/models'

defineProps<{
  groups: Group[]
  isAdmin: boolean
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
  (event: 'select', id: Group['id']): void // NOSONAR: S6598
}>()

function handleClick(id: Group['id']) {
  emit('select', id)
}
</script>

<template>
  <v-row>
    <v-col v-for="group in groups" :key="group.id" cols="12" md="4">
      <GroupListCard
        :group="group"
        :is-admin="isAdmin"
        @click="handleClick(group.id)"
      />
    </v-col>
  </v-row>
</template>
