<template>
  <BaseScreen class="host-create-lobby" @home="goBack">
    <section class="hero">
      <h1 class="hero-title">Crea una nova sala</h1>
      <p class="hero-subtitle">
        Configura el nom i la dificultat abans de començar.
      </p>
    </section>

    <div class="card-paper form-card">
      <div class="options-grid">
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
          <label for="game-mode">Mode de joc</label>
          <div class="select-wrapper">
            <select
              id="game-mode"
              v-model="selectedGameMode"
              class="select-field"
            >
              <option value="normal">Normal</option>
              <option value="muerte-subita">Muerte Súbita</option>
            </select>
            <i class="fa-solid fa-chevron-down select-icon"></i>
          </div>
          <p v-if="selectedGameMode === 'muerte-subita'" class="gamemode-warning">
            ☠️ Muerte Súbita: requereix 100💰 per jugador i força la dificultat
            "Difícil".
          </p>
        </div>

        <div class="form-field">
          <label for="difficulty">Dificultat</label>
          <div class="select-wrapper">
            <select
              id="difficulty"
              v-model="selectedDifficulty"
              class="select-field"
              :disabled="selectedGameMode === 'muerte-subita'"
            >
              <option value="easy">Fàcil</option>
              <option value="medium">Mitjana</option>
              <option value="hard">Difícil</option>
            </select>
            <i class="fa-solid fa-chevron-down select-icon"></i>
          </div>
          <p v-if="selectedGameMode === 'muerte-subita'" class="difficulty-note">
            La dificultat queda bloquejada en "Difícil" per la Muerte Súbita.
          </p>
        </div>

        <div class="form-field form-field--inline">
          <label for="max-players">Jugadors</label>
          <div class="select-wrapper">
            <select
              id="max-players"
              v-model="maxPlayers"
              class="select-field"
            >
              <option :value="2">2 jugadors</option>
              <option :value="3">3 jugadors</option>
              <option :value="4">4 jugadors</option>
            </select>
            <i class="fa-solid fa-chevron-down select-icon"></i>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          class="btn btn-ghost"
          type="button"
          @click="
            gameStore.playClickSound();
            goBack();
          "
        >
          Cancel·lar
        </button>
        <button
          class="btn btn-primary"
          type="button"
          @click="
            gameStore.playClickSound();
            createRoom();
          "
        >
          Crear sala
        </button>
      </div>
    </div>
  </BaseScreen>
</template>

<script setup>
import { ref, watch } from "vue";
import BaseScreen from "./layout/BaseScreen.vue";
import { useGameStore } from "../stores/gameStore";

const emit = defineEmits(["backToLobby", "roomCreated"]);
const gameStore = useGameStore();

const roomName = ref("");
const selectedDifficulty = ref("easy");
const selectedGameMode = ref("normal");
const maxPlayers = ref(4);

// Watch for game mode changes to auto-set difficulty
watch(selectedGameMode, (newMode, oldMode) => {
  if (newMode === "muerte-subita") {
    selectedDifficulty.value = "hard";
    return;
  }

  // Restore a default difficulty when leaving Muerte Súbita
  if (oldMode === "muerte-subita" && selectedDifficulty.value === "hard") {
    selectedDifficulty.value = "medium";
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
  if (selectedGameMode.value === "muerte-subita") {
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
    //Upon failure go back to the lobby
    goBack();
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

  // Emitir al servidor para crear la sala con nombre, dificultad, maxPlayers, userId y username
  gameStore.manager.emit("createRoom", {
    name: name,
    difficulty: selectedDifficulty.value,
    maxPlayers: maxPlayers.value,
    gameMode: selectedGameMode.value,
    userId: gameStore.userId,
    username: gameStore.username,
  });

  // Si no es modo muerte súbita, emitir inmediatamente
  if (selectedGameMode.value !== "muerte-subita") {
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
  justify-content: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-2xl);
  background: var(--color-secondary);
}

.hero {
  max-width: min(520px, 90vw);
  color: var(--color-primary);
  text-shadow: var(--shadow-sm);
  text-align: center;
  margin-top: var(--spacing-xl);
}

.hero-subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.form-card {
  width: min(680px, 94vw);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  align-items: center;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
  width: 100%;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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

.form-field--inline .select-wrapper {
  width: 100%;
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
  width: 100%;
}

.form-actions .btn {
  flex: 1;
}

@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

