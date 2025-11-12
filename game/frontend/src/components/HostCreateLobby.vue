<template>
  <div class="host-create-lobby">
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

    <button class="btn-icon back-button" aria-label="Volver" @click="gameStore.playClickSound(); goBack()">
      <i class="fa-solid fa-house"></i>
    </button>

    <section class="hero">
      <h1 class="hero-title">Crea una nova sala</h1>
      <p class="hero-subtitle">Configura el nom i la dificultat abans de començar.</p>
    </section>

    <div class="card-paper form-card">
      <div class="form-field">
        <label for="room-name">Nom de la sala</label>
        <input
          id="room-name"
          v-model="roomName"
          type="text"
          placeholder="Escriu un nom memorable"
          class="input-field"
          @keypress.enter="createRoom"
        />
      </div>

      <div class="form-field">
        <label for="difficulty">Dificultat</label>
        <div class="select-wrapper">
          <select
            id="difficulty"
            v-model="selectedDifficulty"
            class="select-field"
          >
            <option value="easy">Fàcil</option>
            <option value="medium">Mitjana</option>
            <option value="hard">Difícil</option>
          </select>
          <i class="fa-solid fa-chevron-down select-icon"></i>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" type="button" @click="gameStore.playClickSound(); goBack()">Cancel·lar</button>
        <button class="btn btn-primary" type="button" @click="gameStore.playClickSound(); createRoom()">Crear sala</button>
      </div>
    </div>
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

.host-create-lobby {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-2xl) var(--spacing-xl) var(--spacing-2xl);
  background: url('@/img/bgimage.png') center/cover no-repeat;
  text-align: center;
}

.hero {
  max-width: 520px;
  color: var(--text-white);
  text-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.hero-title {
  margin: 0 0 var(--spacing-sm);
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.4rem, 5vw, 3.2rem);
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

.hero-subtitle {
  margin: 0;
  font-size: 1.1rem;
}

.form-card {
  width: min(520px, 90vw);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  text-align: left;
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
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-field label {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.06rem;
}

.select-wrapper {
  position: relative;
}

.select-wrapper .select-field {
  width: 100%;
  padding-right: var(--spacing-xl);
}

.select-icon {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-primary);
  pointer-events: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.form-actions .btn {
  flex: 1;
}

.back-button {
  position: absolute;
  top: var(--spacing-xl);
  left: var(--spacing-xl);
}

@media (max-width: 768px) {
  .hero {
    max-width: 90vw;
  }

  .form-actions {
    flex-direction: column;
  }

  .back-button {
    top: var(--spacing-lg);
    left: var(--spacing-lg);
  }
}

</style>