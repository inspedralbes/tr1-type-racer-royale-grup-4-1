<template>
  <div class="eliminated-screen">
    <div class="scanlines"></div>
    
    <div class="elimination-container">
      <div class="skull-icon">💀</div>
      
      <h1 class="title">¡ELIMINADO!</h1>
      
      <div class="message-box">
        <p class="main-message">{{ mainMessage }}</p>
        <p class="mode-name">MUERTE SÚBITA</p>
        <p class="sub-message">{{ subMessage }}</p>
      </div>
      
      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-icon">{{ eliminationIcon }}</span>
          <span class="stat-value error-count">{{ eliminationReason === 'timeout' ? '⏰' : '1' }}</span>
        </div>
      </div>
      
      <button class="back-button" @click="handleBackToLobby">
        <i class="fa-solid fa-arrow-left"></i>
        <span>VOLVER AL LOBBY</span>
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

// Mensajes dinámicos basados en el motivo de eliminación
const mainMessage = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return 'Se te ha agotado el tiempo en modo';
  }
  return 'Has cometido un error en modo';
});

const subMessage = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return 'El tiempo límite significa eliminación instantánea.';
  }
  return 'Un solo error significa eliminación instantánea.';
});

const eliminationIcon = computed(() => {
  if (props.eliminationReason === 'timeout') {
    return '⏰';
  }
  return '❌';
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

.eliminated-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle at top, color-mix(in srgb, var(--color-secondary) 60%, var(--bg-body) 40%), var(--color-primary));
  position: relative;
  overflow: hidden;
  font-family: 'Poppins', sans-serif;
}

/* Scanlines effect */
.scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08),
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1;
}

.elimination-container {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 3rem;
  background: color-mix(in srgb, var(--bg-card) 78%, var(--color-secondary) 22%);
  border: 4px solid color-mix(in srgb, var(--color-danger) 45%, var(--color-primary) 55%);
  border-radius: 20px;
  box-shadow: 
    0 0 30px rgba(91, 63, 27, 0.4),
    0 0 60px rgba(139, 165, 155, 0.25),
    inset 0 0 20px rgba(91, 63, 27, 0.15);
  max-width: 600px;
  animation: slideIn 0.5s ease-out, pulse 2s ease-in-out infinite;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 
      0 0 30px rgba(91, 63, 27, 0.4),
      0 0 60px rgba(139, 165, 155, 0.25),
      inset 0 0 20px rgba(91, 63, 27, 0.15);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(91, 63, 27, 0.5),
      0 0 80px rgba(139, 165, 155, 0.35),
      inset 0 0 30px rgba(91, 63, 27, 0.2);
  }
}

.skull-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: shake 0.6s ease-in-out;
  filter: drop-shadow(0 0 18px rgba(91, 63, 27, 0.4));
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-5deg); }
  20%, 40%, 60%, 80% { transform: translateX(10px) rotate(5deg); }
}

.title {
  font-size: 4rem;
  font-weight: 900;
  color: color-mix(in srgb, var(--color-danger) 65%, var(--color-primary) 35%);
  margin: 0 0 2rem 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 
    0 0 16px rgba(91, 63, 27, 0.35),
    3px 3px 0 rgba(0, 0, 0, 0.35);
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  41%, 43% { opacity: 0.8; }
  45%, 47% { opacity: 0.9; }
  49% { opacity: 1; }
}

.message-box {
  background: color-mix(in srgb, var(--color-secondary) 20%, transparent 80%);
  border: 2px solid color-mix(in srgb, var(--color-secondary) 35%, transparent 65%);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.main-message {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
  font-weight: 400;
}

.mode-name {
  font-size: 2rem;
  font-weight: 900;
  color: color-mix(in srgb, var(--color-danger) 55%, var(--color-primary) 45%);
  margin: 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 12px rgba(91, 63, 27, 0.45);
}

.sub-message {
  font-size: 1rem;
  color: color-mix(in srgb, var(--text-muted) 70%, var(--text-white) 30%);
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.stats-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--bg-card) 60%, var(--bg-body) 40%);
  border-radius: 10px;
}

.stat-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
}

.error-count {
  color: color-mix(in srgb, var(--color-danger) 60%, var(--color-primary) 40%);
  text-shadow: 0 0 12px rgba(91, 63, 27, 0.4);
}

.back-button {
  background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-secondary) 55%, var(--color-primary) 45%) 100%);
  color: var(--text-white);
  border: 3px solid color-mix(in srgb, var(--text-white) 80%, transparent 20%);
  border-radius: 12px;
  padding: 1rem 3rem;
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 
    0 4px 18px rgba(91, 63, 27, 0.35),
    inset 0 -2px 5px rgba(0, 0, 0, 0.18);
}

.back-button:hover {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 80%, var(--color-secondary) 20%), var(--color-secondary));
  transform: translateY(-2px);
  box-shadow: 
    0 6px 24px rgba(91, 63, 27, 0.45),
    inset 0 -2px 5px rgba(0, 0, 0, 0.25);
}

.back-button:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 10px rgba(91, 63, 27, 0.3),
    inset 0 2px 5px rgba(0, 0, 0, 0.4);
}

.back-button i {
  font-size: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .elimination-container {
    padding: 2rem;
    max-width: 90%;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .skull-icon {
    font-size: 3rem;
  }
  
  .mode-name {
    font-size: 1.5rem;
  }
  
  .back-button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
  }
}
</style>
