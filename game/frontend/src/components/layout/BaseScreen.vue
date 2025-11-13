<template>
  <div class="base-screen" v-bind="$attrs">
    <slot />

    <button
      v-if="showHome"
      class="btn-icon base-screen__home-button"
      :aria-label="homeAriaLabel"
      @click="handleHome"
    >
      <i class="fa-solid fa-house"></i>
    </button>

    <Config v-if="showConfig" />
  </div>
</template>

<script setup>
import Config from '../Config.vue';
import { useGameStore } from '../../stores/gameStore';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  showHome: {
    type: Boolean,
    default: true,
  },
  showConfig: {
    type: Boolean,
    default: true,
  },
  homeAriaLabel: {
    type: String,
    default: 'Volver al menú principal',
  },
});

const emit = defineEmits(['home']);

const gameStore = useGameStore();

function handleHome() {
  gameStore.playClickSound();
  emit('home');
}
</script>

<style scoped>
.base-screen {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.base-screen__home-button {
  position: fixed;
  bottom: var(--layout-fab-bottom);
  left: var(--layout-fab-horizontal);
  z-index: 100;
  width: var(--layout-fab-size);
  height: var(--layout-fab-size);
}

.base-screen__home-button i {
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .base-screen__home-button {
    bottom: var(--spacing-lg);
    left: var(--spacing-lg);
  }
}
</style>

