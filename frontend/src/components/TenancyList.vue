<script setup lang="ts">
import TenancyCard from '@/components/TenancyCard.vue'
import type { Tenancy } from '@/models/tenancy.model'

defineProps<{ tenancies: Tenancy[] }>()

type EmitFn = (event: 'select', id: Tenancy['id']) => void
const emit = defineEmits<EmitFn>()

const handleClick = (id: Tenancy['id']) => emit('select', id)
</script>

<template>
  <v-row>
    <v-col v-for="tenancy in tenancies" :key="tenancy.id" cols="12" md="4">
      <TenancyCard :tenancy="tenancy" @click="handleClick(tenancy.id)" />
    </v-col>
  </v-row>
</template>
