<script setup lang="ts">
import { ref } from 'vue'

import ServiceRoleListCard from '@/components/service/ServiceRoleListCard.vue'
import ButtonSecondary from '@/components/ui/ButtonSecondary.vue'
import { type ServiceRoleDetailFields } from '@/models/servicerole.model'

// --- Component Interface -----------------------------------------------------

const { serviceRoles } = defineProps<{
  serviceRoles: ServiceRoleDetailFields[]
}>()

const emit = defineEmits<{
  'add-service-role': []
  'remove-service-role': [number]
  'update-service-role': [number, ServiceRoleDetailFields]
}>()

// --- Component State ---------------------------------------------------------

const cardRefs = ref<InstanceType<typeof ServiceRoleListCard>[]>([])

// --- Component Methods -------------------------------------------------------

const handleAddServiceRole = () => {
  emit('add-service-role')
}

const isDuplicateName = (index: number) => {
  const name = serviceRoles[index]?.name.trim()
  return serviceRoles.some((r, i) => i !== index && r.name.trim() === name)
}

const validate = async () => {
  const results = await Promise.all(
    cardRefs.value.map((card) => card.validate()),
  )

  return results.every(Boolean)
}

defineExpose({ validate })
</script>

<template>
  <div>
    <ButtonSecondary
      class="mb-4"
      text="Add Role"
      @click="handleAddServiceRole"
    />

    <v-row>
      <v-col
        v-for="(serviceRole, index) in serviceRoles"
        :key="index"
        cols="12"
        md="6"
      >
        <ServiceRoleListCard
          ref="cardRefs"
          :is-duplicate-name="isDuplicateName(index)"
          :model-value="serviceRole"
          @remove-role="emit('remove-service-role', index)"
          @update:model-value="emit('update-service-role', index, $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>
