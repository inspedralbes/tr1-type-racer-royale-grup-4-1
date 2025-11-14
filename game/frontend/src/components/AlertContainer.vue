<template>
  <div class="alert-container">
    <GameAlert
      v-for="(alert, index) in alerts"
      :key="alert.id"
      :message="alert.message"
      :type="alert.type"
      :duration="alert.duration"
      :index="index"
      @dismiss="removeAlert(alert.id)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import GameAlert from './GameAlert.vue';
import { useGameAlert } from '../composables/useGameAlert.js';

const { alerts, removeAlert } = useGameAlert();
</script>

<style scoped>
.alert-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
}

.alert-container > * {
  pointer-events: auto;
}
</style>

