<template>
  <div class="eliminated-screen">
    <div class="scanlines"></div>
    
    <div class="elimination-container">
      <div class="skull-icon">💀</div>
      
      <h1 class="title">¡ELIMINADO!</h1>
      
      <div class="message-box">
        <p class="main-message">Has cometido un error en modo</p>
        <p class="mode-name">MUERTE SÚBITA</p>
        <p class="sub-message">Un solo error significa eliminación instantánea.</p>
      </div>
      
      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-value error-count">1</span>
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
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(['back']);
const gameStore = useGameStore();

function handleBackToLobby() {
  gameStore.playClickSound();
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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d0a0a 100%);
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
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
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
  background: rgba(0, 0, 0, 0.8);
  border: 4px solid #ff0000;
  border-radius: 20px;
  box-shadow: 
    0 0 30px rgba(255, 0, 0, 0.5),
    0 0 60px rgba(255, 0, 0, 0.3),
    inset 0 0 20px rgba(255, 0, 0, 0.1);
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
      0 0 30px rgba(255, 0, 0, 0.5),
      0 0 60px rgba(255, 0, 0, 0.3),
      inset 0 0 20px rgba(255, 0, 0, 0.1);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 0, 0, 0.7),
      0 0 80px rgba(255, 0, 0, 0.5),
      inset 0 0 30px rgba(255, 0, 0, 0.2);
  }
}

.skull-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: shake 0.5s ease-in-out;
  filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8));
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-5deg); }
  20%, 40%, 60%, 80% { transform: translateX(10px) rotate(5deg); }
}

.title {
  font-size: 4rem;
  font-weight: 900;
  color: #ff0000;
  margin: 0 0 2rem 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 
    0 0 10px rgba(255, 0, 0, 0.8),
    0 0 20px rgba(255, 0, 0, 0.6),
    0 0 30px rgba(255, 0, 0, 0.4),
    3px 3px 0 rgba(0, 0, 0, 0.8);
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  41%, 43% { opacity: 0.8; }
  45%, 47% { opacity: 0.9; }
  49% { opacity: 1; }
}

.message-box {
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid rgba(255, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.main-message {
  font-size: 1.3rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 400;
}

.mode-name {
  font-size: 2rem;
  font-weight: 900;
  color: #ff0000;
  margin: 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
}

.sub-message {
  font-size: 1rem;
  color: #cccccc;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.stats-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}

.stat-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
}

.stat-label {
  color: #ffffff;
  font-weight: 600;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
}

.error-count {
  color: #ff0000;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
}

.back-button {
  background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
  color: white;
  border: 3px solid #ffffff;
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
    0 4px 15px rgba(255, 0, 0, 0.4),
    inset 0 -2px 5px rgba(0, 0, 0, 0.3);
  font-family: 'Poppins', sans-serif;
}

.back-button:hover {
  background: linear-gradient(135deg, #ff3333 0%, #ff0000 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 0, 0, 0.6),
    inset 0 -2px 5px rgba(0, 0, 0, 0.3);
}

.back-button:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 10px rgba(255, 0, 0, 0.4),
    inset 0 2px 5px rgba(0, 0, 0, 0.5);
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
