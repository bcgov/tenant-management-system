<script setup lang="ts">
import BaseAdminContainer from '@/components/container/BaseAdminContainer.vue'
import BaseSecureView from '@/views/BaseSecureView.vue'
</script>

<template>
  <BaseSecureView>
    <BaseAdminContainer>
      <div>
        <h1>Settings</h1>
      </div>
    </BaseAdminContainer>
  </BaseSecureView>
</template>
