<template>
  <div class="host-create-lobby">
    <div class="scanlines"></div>
    <div class="pixel-stars">
      <div class="pixel-star" v-for="n in 8" :key="n"></div>
    </div>
    
    <div class="title-container">
      <h1 class="title">
        <span class="word word-1">CREAR SALA</span>
      </h1>
    </div>

    <Config />
    
    <div class="input-container">
      <input 
        v-model="roomName" 
        type="text"
        placeholder="Nombre de la sala"
        class="name-input"
        @keypress.enter="createRoom"
      />
    </div>
    
    <div class="difficulty-container">
      <label class="difficulty-label">Dificultad:</label>
      <select 
        v-model="selectedDifficulty" 
        class="difficulty-select"
        :disabled="selectedGameMode === 'muerte-subita'"
      >
        <option value="easy">Fácil</option>
        <option value="medium">Medio</option>
        <option value="hard">Difícil</option>
      </select>
      <p v-if="selectedGameMode === 'muerte-subita'" class="difficulty-note">
        La dificultad se establece automáticamente en Difícil para Muerte Súbita
      </p>
    </div>
    
    <div class="gamemode-container">
      <label class="gamemode-label">Modo de Juego:</label>
      <select 
        v-model="selectedGameMode" 
        class="gamemode-select"
      >
        <option value="normal">Normal</option>
        <option value="muerte-subita">Muerte Súbita (100)</option>
      </select>
      <p v-if="selectedGameMode === 'muerte-subita'" class="gamemode-warning">
        Entrada: 100 | Un error = Eliminación | El ganador se lleva todo
      </p>
    </div>
    <br><br>
    <div class="button-container">
      <button class="play-button btn" @click="gameStore.playClickSound(); goBack()">
        <span class="button-text">ATRÁS</span>
        <span class="pixel-border"></span>
        <span class="button-pixels"></span>
       
      </button>
     
      <button class="play-button btn" @click="gameStore.playClickSound(); createRoom()">
        <span class="button-text">CREAR</span>
        <span class="pixel-border"></span>
        <span class="button-pixels"></span>
      </button>
    </div>

    <button class="back-button" aria-label="Volver" @click="gameStore.playClickSound(); goBack()">
      <i class="fa-solid fa-house"></i>
    </button>
  </div>
</template>

<script setup>
import Config from "./Config.vue";

import { ref, watch } from "vue";
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(["backToLobby", "roomCreated"]);
const gameStore = useGameStore();

const roomName = ref("");
const selectedDifficulty = ref("easy");
const selectedGameMode = ref("normal");

// Watch for game mode changes to auto-set difficulty
watch(selectedGameMode, (newMode) => {
  if (newMode === 'muerte-subita') {
    selectedDifficulty.value = 'hard';
  }
});

function goBack() {
  // Emit the backToLobby event and ensure we're showing the Lobby view
  emit("backToLobby");
  // Also update the route if using Vue Router, or ensure the parent component shows the Lobby
  // The parent App.vue should handle showing the Lobby component when showLobby is true
}

function createRoom() {
  const name = roomName.value.trim();
  if (!name) {
    alert("Por favor introduce un nombre de sala válido.");
    return;
  }

  // Verificar si tiene suficiente dinero para modo Muerte Súbita
  if (selectedGameMode.value === 'muerte-subita') {
    if (!gameStore.userId) {
      alert("Debes iniciar sesión para jugar en modo Muerte Súbita.");
      return;
    }
    // El servidor verificará el dinero y deducirá la entrada
  }

  // Configurar listeners para respuestas del servidor
  const handleRoomCreationFailed = (data) => {
    alert(data.message || "Error al crear la sala");
    gameStore.manager.off("roomCreationFailed", handleRoomCreationFailed);
  };

  const handleMoneyUpdated = (data) => {
    gameStore.setMoney(data.newMoney);
    gameStore.manager.off("moneyUpdated", handleMoneyUpdated);
  };

  const handleRoomCreated = () => {
    emit("roomCreated", name);
    gameStore.manager.off("roomCreationFailed", handleRoomCreationFailed);
    gameStore.manager.off("moneyUpdated", handleMoneyUpdated);
  };

  // Configurar listeners temporales
  gameStore.manager.on("roomCreationFailed", handleRoomCreationFailed);
  gameStore.manager.on("moneyUpdated", handleMoneyUpdated);

  // Emitir al servidor para crear la sala con nombre, dificultad y modo de juego
  gameStore.manager.emit("createRoom", {
    name: name,
    difficulty: selectedDifficulty.value,
    gameMode: selectedGameMode.value,
    userId: gameStore.userId,
    username: gameStore.username
  });

  // Si no es modo muerte súbita, emitir inmediatamente
  if (selectedGameMode.value !== 'muerte-subita') {
    handleRoomCreated();
  } else {
    // Para muerte súbita, esperar confirmación del servidor
    setTimeout(() => {
      // Si no hay error después de 2 segundos, asumir éxito
      handleRoomCreated();
    }, 2000);
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.host-create-lobby {
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

/* Scanlines */
.scanlines {
  position: fixed;
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
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

/* Pixel stars */
.pixel-stars {
  position: absolute;
  width: 120%;
  height: 120%;
  pointer-events: none;
  z-index: 1;
}

.pixel-star {
  position: absolute;
  width: 12px; 
  height: 12px;
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
  margin-bottom: 2rem;
}

.title {
  font-size: 4rem;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  text-transform: uppercase;
  color: #FFD700;
  text-shadow:
    -1px -1px 0 #000,
     0   -1px 0 #000,
     1px -1px 0 #000,
     1px  0   0 #000,
     1px  1px 0 #000,
     0    1px 0 #000,
    -1px  1px 0 #000,
    -1px  0   0 #000;
  animation: titleGlitch 3s infinite, titleFloat 4s ease-in-out infinite;
}

@keyframes glitchContainer {
  0%, 90%, 100% { transform: translate(0, 0); }
  91% { transform: translate(-2px, 1px); }
  92% { transform: translate(2px, -1px); }
  93% { transform: translate(-1px, 2px); }
  94% { transform: translate(1px, -2px); }
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

/* Input group */
.input-container {
  width: 100%;
  max-width: 500px;
  margin: 2rem 0 1rem 0;
  position: relative;
  z-index: 2;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 6rem;  
  width: 100%;
  max-width: 500px;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.name-input {
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border: 2px solid #333;
  border-radius: 4px;
  outline: none;
  width: 100%;
  max-width: 300px;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
}

.name-input:focus {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.difficulty-container {
  width: 100%;
  max-width: 500px;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.difficulty-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  font-family: 'Poppins', sans-serif;
}

.difficulty-select {
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border: 2px solid #333;
  border-radius: 4px;
  outline: none;
  width: 100%;
  max-width: 300px;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.difficulty-select:focus {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.difficulty-select:hover {
  border-color: #FFA500;
}

.difficulty-select:disabled {
  background: rgba(200, 200, 200, 0.5);
  color: #666;
  cursor: not-allowed;
  border-color: #ccc;
}

.difficulty-note {
  font-size: 0.85rem;
  color: #FFA500;
  font-weight: 500;
  text-align: center;
  margin-top: 0.5rem;
  padding: 0.3rem 0.8rem;
  background: rgba(255, 165, 0, 0.1);
  border-radius: 4px;
  border: 1px solid #FFA500;
}

.gamemode-container {
  width: 100%;
  max-width: 500px;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.gamemode-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  font-family: 'Poppins', sans-serif;
}

.gamemode-select {
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border: 2px solid #333;
  border-radius: 4px;
  outline: none;
  width: 100%;
  max-width: 300px;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.gamemode-select:focus {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.gamemode-select:hover {
  border-color: #FFA500;
}

.gamemode-warning {
  font-size: 0.9rem;
  color: #ff4444;
  font-weight: 600;
  text-align: center;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 4px;
  border: 1px solid #ff4444;
}

.button-group {
  display: flex;
  gap: 6rem;
  margin-top: 2rem;
  justify-content: center;
  flex-wrap: wrap;
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
  0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
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

@keyframes buttonPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  50% { box-shadow: 0 6px 25px rgba(255,140,0,0.5); }
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.back-button i {
  font-size: 1.25rem;
}

.back-button:active {
  transform: scale(0.98);
}
  .title { font-size: 3rem; }
  .actions { gap: 3rem; }



</style>