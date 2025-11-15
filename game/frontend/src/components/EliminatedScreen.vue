<template>
  <div class="eliminated-screen">
    <div class="scanlines"></div>
    
    <div class="elimination-container">
      <div class="skull-icon"><i class="fa-solid fa-skull"></i></div>
      
      <h1 class="title">ELIMINAT!</h1>
      
      <div class="message-box">
        <p class="main-message">{{ mainMessage }}</p>
        <p class="mode-name">MORT SÚBITA</p>
        <p class="sub-message">{{ subMessage }}</p>
      </div>
      
      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-icon" v-html="eliminationIcon"></span>
          <span class="stat-value error-count" v-html="eliminationReason === 'timeout' ? '<i class=\'fa-solid fa-clock\'></i>' : '1'"></span>
        </div>
      </div>
      
      <button class="back-button" @click="handleBackToLobby">
        <i class="fa-solid fa-arrow-left"></i>
        <span>TORNAR AL LOBBY</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore';

const props = defineProps({
  eliminationReason: {
    type: String,
    default: 'error' // 'error' or 'timeout'
  }
});

const emit = defineEmits(['back']);
const gameStore = useGameStore();

// Missatges dinàmics basats en el motiu d'eliminació
const mainMessage = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return 'S\'ha esgotat el temps en mode';
  }
  return 'Has comès un error en mode';
});

const subMessage = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return 'El temps límit significa eliminació instantània.';
  }
  return 'Un sol error significa eliminació instantània.';
});

const eliminationIcon = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return '<i class="fa-solid fa-clock"></i>';
  }
  return '<i class="fa-solid fa-xmark"></i>';
});

function handleBackToLobby() {
  gameStore.playClickSound();
  
  // Salir de la sala actual si existe
  if (gameStore.currentRoom) {
    gameStore.manager.emit('leaveRoom', gameStore.currentRoom);
    gameStore.setRoomName('');
  }
  
  emit('back');
}
</script>

<style scoped>
.eliminated-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-screen);
  position: relative;
  overflow: hidden;
}

.scanlines {
  display: none;
}

.elimination-container {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-card);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skull-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  color: var(--color-primary);
}

.title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xl) 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: var(--shadow-sm);
}

.message-box {
  background: var(--bg-input);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.main-message {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-weight: var(--font-weight-normal);
}

.mode-name {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: var(--spacing-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
}

.sub-message {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: var(--spacing-sm) 0 0 0;
}

.stats-container {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-input);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.stat-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.error-count {
  color: var(--text-primary);
}

.back-button {
  background: var(--color-primary);
  color: var(--text-white);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-2xl);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.back-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.back-button i {
  font-size: 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .elimination-container {
    padding: var(--spacing-xl);
    max-width: 90%;
  }
  
  .skull-icon {
    font-size: 3rem;
  }
  
  .back-button {
    padding: var(--spacing-sm) var(--spacing-xl);
    font-size: var(--font-size-base);
  }
}
</style>
