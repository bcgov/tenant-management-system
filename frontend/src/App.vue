<script setup lang="ts">
import Header from '@/components/Header.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import notificationService from '@/services/notification'

// Access the notifications state from the notification service
const notifications = notificationService.state.notifications
</script>

<template>
  <v-app>
    <!-- Notification container that iterates through and displays notifications -->
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="notification-container"
    >
      <!-- Vuetify alert component for each notification -->
      <v-alert
        :type="notification.type"
        closable
        @click="notificationService.removeNotification(notification.id)"
      >
        {{ notification.message }}
      </v-alert>
    </div>
    <!-- Header component -->
    <Header></Header>
    <!-- Navbar component -->
    <NavigationBar />
    <v-main>
      <!-- Router view for dynamic component rendering -->
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<style scoped>
@import 'vuetify/styles';

/* Main container adjustments */
.v-main {
  --v-layout-top: 0px;
}

/* Notification container styling */
.notification-container {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  z-index: 9999;
  margin-bottom: 10px;
}
</style>
