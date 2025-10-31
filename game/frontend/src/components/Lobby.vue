<template>
  <div class="lobby">
    <div class="scanlines"></div>
    <div class="pixel-stars">
      <div class="pixel-star" v-for="n in 8" :key="n"></div>
    </div>
    <div class="title-container">
      <h1 class="title">
        <span class="word word-1">Lobby</span>
      </h1>
    </div>

    <Config />
    <div v-if="!hasNameSaved" class="name-input-wrapper">
      <div class="name-input-container">
        <div class="input-group">
          <input
            v-model="playerName"
            type="text"
            placeholder="Introduce tu nombre"
            class="name-input"
            maxlength="20"
            @keypress="handleKeyPress"
          />
          <button class="play-button btn" @click="savePlayerName">
            <span class="button-text">GUARDAR</span>
            <span class="pixel-border"></span>
            <span class="button-pixels"></span>
          </button>
        </div>
      </div>
    </div>
    <p v-else class="welcome-text">Bienvenido, {{ gameStore.username }}</p>

    <div v-if="hasNameSaved" class="actions">
      <button class="play-button btn" @click="handleCreateRoom">
        <span class="button-text">CREAR SALA</span>
        <span class="pixel-border"></span>
        <span class="button-pixels"></span>
      </button>
      <button class="play-button btn" @click="handleJoinRoom">
        <span class="button-text">UNIRSE SALA</span>
        <span class="pixel-border"></span>
        <span class="button-pixels"></span>
      </button>
    </div>

    <button class="back-button" aria-label="Volver" @click="emit('back')">
      <i class="fa-solid fa-house"></i>
    </button>
  </div>
</template>

<script setup>
import Config from './Config.vue';
import { ref, onMounted } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const playerName = ref('');
const hasNameSaved = ref(false);
const emit = defineEmits(['back', 'createRoom', 'joinRoom']);

onMounted(() => {
  if (gameStore.username) {
    playerName.value = gameStore.username;
    hasNameSaved.value = true;
  }
});

function savePlayerName() {
  if (playerName.value.trim()) {
    gameStore.setUsername(playerName.value.trim());
    hasNameSaved.value = true;
    gameStore.manager.emit('saveUsername', playerName.value.trim());
    console.log('Username guardado:', playerName.value.trim());
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    savePlayerName();
  }
}

function handleCreateRoom() {
  emit('createRoom');
}

function handleJoinRoom() {
  if (!playerName.value.trim()) {
    alert('Por favor, introduce tu nombre');
    return;
  }

  // Configurar los listeners para actualización de salas
  gameStore.manager.on('roomData', (rooms) => {
    console.log('roomData recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  gameStore.manager.on('updateRooms', (rooms) => {
    console.log('updateRooms recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });

  // Guardar el nombre del jugador
  savePlayerName();
  
  // Solicitar la lista de salas disponibles
  gameStore.manager.emit('getRooms');
  
  // Navegar a la vista de salas
  emit('joinRoom');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  box-sizing: border-box;
  position: relative;
  background-size: cover;
  font-family: 'Poppins', sans-serif;
  color: #333;
  text-align: center;
  width: 100%;
  overflow: hidden;
  padding: 2rem 0;
}

.scanlines {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 3px
  );
  animation: scanlineMove 8s linear infinite;
  z-index: 10;
}

@keyframes scanlineMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

.pixel-stars {
  position: absolute;
  width: 120%;
  height: 120%;
  pointer-events: none;
  z-index: 1;
}
.pixel-star {
  position: absolute;
  width: 12px; height: 12px;
  background: #FFA500;
  box-shadow: 0 0 10px #FFA500, inset 0 0 5px #ffffff;
  animation: pixelStarBlink 1.5s ease-in-out infinite;
}
.pixel-star:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.pixel-star:nth-child(2) { top: 20%; right: 15%; animation-delay: 0.3s; }
.pixel-star:nth-child(3) { top: 70%; left: 15%; animation-delay: 0.6s; }
.pixel-star:nth-child(4) { top: 80%; right: 20%; animation-delay: 0.9s; }
.pixel-star:nth-child(5) { top: 30%; left: 5%; animation-delay: 0.2s; }
.pixel-star:nth-child(6) { top: 50%; right: 10%; animation-delay: 0.5s; }
.pixel-star:nth-child(7) { top: 15%; left: 85%; animation-delay: 0.8s; }
.pixel-star:nth-child(8) { top: 65%; left: 80%; animation-delay: 0.4s; }

@keyframes pixelStarBlink {
  0%, 50%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  25% { opacity: 0.3; transform: scale(1.3) rotate(45deg); }
  75% { opacity: 0.5; transform: scale(0.8) rotate(-45deg); }
}

.title-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: glitchContainer 5s infinite;
  margin-bottom: 1rem;
  margin-top: -1rem; /* Ajuste para subir un poco el título */
}
@keyframes glitchContainer {
  0%, 90%, 100% { transform: translate(0, 0); }
  91% { transform: translate(-2px, 1px); }
  92% { transform: translate(2px, -1px); }
  93% { transform: translate(-1px, 2px); }
  94% { transform: translate(1px, -2px); }
}

.title {
  font-size: 6rem;
  font-weight: 900;
  margin: 0;
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-transform: uppercase;
  animation: titleGlitch 3s infinite, titleFloat 4s ease-in-out infinite;
}
.word {
  display: block;
  animation: wordBlink 2s ease-in-out infinite;
}
.word-1 {
  color: #FFD700;
  text-shadow:
    -1px -1px 0 #000,
    0   -1px 0 #000,
    1px -1px 0 #000,
    1px  0   0 #000,
    1px  1px 0 #000,
    0    1px 0 #000,
    -1px  1px 0 #000,
    -1px  0   0 #000,
    0 0 10px rgba(0,0,0,0.5);
  font-weight: 900;
}
@keyframes titleGlitch {
  0%, 85%, 100% { transform: skew(0deg); }
  86% { transform: skew(-1deg); }
  88% { transform: skew(1deg); }
  90% { transform: skew(0deg); }
}
@keyframes titleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes wordBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.name-input-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.name-input-container {
  display: flex;
  justify-content: center;
  max-width: 500px;
  width: 100%;
  padding: 0 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  width: 100%;
  max-width: 300px;
  margin: 1rem 0;
}

.name-input {
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border: 2px solid #333;
  border-radius: 4px;
  outline: none;
  width: 100%;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
  height: 48px;
}

.submit-button {
  padding: 0 1.5rem;
  font-size: 1rem;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  height: 48px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-button:hover {
  background: linear-gradient(90deg, #FFA500, #FFD700);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,140,0,0.4);
}

.submit-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

@keyframes buttonPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 6px 25px rgba(255,140,0,0.5); }
}
.welcome-text {
  font-size: 1.5rem;
  color: #FF9500; /* Naranja vibrante */
  font-weight: 600;
  margin: 0;
  margin-top: 2rem;
  text-shadow:
    0 0 4px #FFB347,       /* brillo naranja suave */
    0 0 1px rgba(0, 0, 0, 0.4); /* sombra sutil para contraste */
  letter-spacing: 0.03em;
}


.actions {
  display: flex;
  gap: 6rem;
  margin-top: 2rem;
}
.btn {
  padding: 1rem 3rem;
  font-size: 1.5rem;
  background-color: #FF8C00;
  color: #ffffff;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  animation: buttonPulse 1.5s ease-in-out infinite;
}
.button-text {
  position: relative;
  
  z-index: 2;
  display: inline-block;
  animation: textGlow 1.5s ease-in-out infinite;
}
@keyframes buttonPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  50% { box-shadow: 0 6px 25px rgba(255,140,0,0.5); }
}
.pixel-border {
  position: absolute;
  inset: 4px;
  border-radius: 50px;
  border: 2px dashed #FFA500;
  animation: borderDash 1s linear infinite;
  pointer-events: none;
}
@keyframes borderDash {
  0% { border-color: #FFA500; }
  50% { border-color: #ffffff; }
  100% { border-color: #FFA500; }
}
.button-pixels {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.2) 3px,
    rgba(255, 255, 255, 0.2) 6px
  );
  animation: pixelScan 1.2s linear infinite;
  pointer-events: none;
}
@keyframes pixelScan {
  0% { left: -100%; }
  100% { left: 100%; }
}
.play-button:hover, .btn:hover {
  background-color: #FFA500;
  transform: translateY(-5px) translateX(-2px);
  box-shadow: 0 8px 30px rgba(255,140,0,0.6);
}
.play-button:hover .button-text {
  animation: textFlicker 0.1s ease-in-out infinite;
}
@keyframes textFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9;}
}
.play-button:active, .btn:active {
  transform: translateY(2px) translateX(1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.back-button {
  position: absolute;
  left: 5vw;
  bottom: 6vh;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  width: 56px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 40;
}
.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}
.back-button i {
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .title { font-size: 4rem; }
  .actions { gap: 1.2rem; }
  .actions .play-button { padding: 0.6rem 1.6rem; font-size: 0.9rem;}
  .actions .button-text { font-size: 0.8rem; padding: 0.4rem 0.8rem; }
}
</style>
