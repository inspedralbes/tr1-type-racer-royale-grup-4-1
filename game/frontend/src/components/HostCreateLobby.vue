<template>
  <div class="host-create-lobby">
    <Config />
    
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
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: url('@/img/bgimage.png') center/cover no-repeat;
  text-align: center;
}

.hero {
  max-width: min(520px, 90vw);
  color: var(--text-white);
  text-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.hero-title {
  margin: 0 0 var(--spacing-sm);
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.4rem, 5vw, 3.2rem);
  text-transform: uppercase;
  color: var(--text-white);
  letter-spacing: 0.08rem;
}

.hero-subtitle {
  margin: 0;
  font-size: 1.1rem;
}

.form-card {
  width: min(520px, 92vw);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  text-align: left;
}

.difficulty-note,
.gamemode-warning {
  margin: var(--spacing-xs) 0 0 0;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--color-primary) 70%, var(--color-warning) 30%);
}

.gamemode-warning {
  color: color-mix(in srgb, var(--color-danger) 70%, var(--color-primary) 30%);
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
  .form-actions {
    flex-direction: column;
  }

  .back-button {
    top: var(--spacing-lg);
    left: var(--spacing-lg);
  }
}
</style>