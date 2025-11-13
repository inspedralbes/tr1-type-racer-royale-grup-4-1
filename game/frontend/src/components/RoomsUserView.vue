<template>
  <Config />
  <div class="salas-container">
    <!-- Home button -->
    <button class="btn-icon back-button" aria-label="Volver" @click="gameStore.playClickSound(); emit('back')">
      <i class="fa-solid fa-house"></i>
    </button>

    <!-- Rooms -->
    <div class="newspaper">
      <!-- Title -->
      <div class="title-container">
        <h1 class="title">Journalism Race</h1>
      </div>
      <div v-if="salasFiltradas.length === 0" class="no-salas-article">
        <h2>No Rooms Available</h2>
        <p>
          It seems the newsroom is empty today. No editors or writers are
          currently hosting a session. Check back later — the presses will roll
          again soon!
        </p>
      </div>

      <div class="salas-grid">
        <button
          v-for="sala in salasFiltradas"
          :key="sala.id"
          :class="['sala-btn', { selected: sala.id === salaSeleccionada, full: sala.isFull }]"
          @click="gameStore.playClickSound(); seleccionarSala(sala.id)"
          :disabled="sala.isFull"
        >
          <div class="sala-content">
            <div class="sala-info-left">
              <div class="sala-nombre">
                {{ sala.nombre }}
                <span v-if="sala.isFull" class="full-badge">LLENA</span>
              </div>
              <div v-if="sala.gameMode === 'muerte-subita'" class="gamemode-badge">
                ☠️ Muerte Súbita | Entrada: 100💰
              </div>
            </div>
            <div class="sala-playercount player-column">
              <span class="player-count"
                >{{ sala.jugadores }}/{{ maxJugadoresPorSala }}</span
              >
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Join button -->
    <div class="unirse-container">
      <button
        class="btn btn-primary play-button"
        :disabled="!salaSeleccionada"
        @click="gameStore.playClickSound(); unirseASala()"
      >
        <span class="button-text">ENTER</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Config from "./Config.vue";
import { useGameStore } from "../stores/gameStore";

const emit = defineEmits(["back", "joinedRoom"]);
const gameStore = useGameStore();
const maxJugadoresPorSala = ref(4);
const salaSeleccionada = ref(null);

const salasFiltradas = computed(() =>
  gameStore.rooms
    .filter((sala) => sala.status !== 'playing') // Filtrar salas que están jugando
    .map((sala) => ({
      id: sala.name,
      nombre: sala.name,
      jugadores: sala.players.length,
      isFull: sala.players.length >= maxJugadoresPorSala.value,
      gameMode: sala.gameMode || 'normal',
    })),
);

const seleccionarSala = (salaId) => {
  salaSeleccionada.value = salaId;
};

const unirseASala = () => {
  if (!salaSeleccionada.value) return;
  
  // Verificar si la sala es modo Muerte Súbita
  const sala = salasFiltradas.value.find(s => s.id === salaSeleccionada.value);
  if (sala && sala.gameMode === 'muerte-subita') {
    if (!gameStore.userId) {
      alert('Debes iniciar sesión para jugar en modo Muerte Súbita.');
      return;
    }
    
    // Configurar listeners para respuestas del servidor
    const handleJoinRoomFailed = (data) => {
      alert(data.message || "Error al unirse a la sala");
      gameStore.manager.off("joinRoomFailed", handleJoinRoomFailed);
      gameStore.manager.off("moneyUpdated", handleMoneyUpdated);
    };

    const handleMoneyUpdated = (data) => {
      gameStore.setMoney(data.newMoney);
      gameStore.manager.off("joinRoomFailed", handleJoinRoomFailed);
      gameStore.manager.off("moneyUpdated", handleMoneyUpdated);
      // Continuar con la unión a la sala
      proceedToJoinRoom();
    };

    // Configurar listeners temporales
    gameStore.manager.on("joinRoomFailed", handleJoinRoomFailed);
    gameStore.manager.on("moneyUpdated", handleMoneyUpdated);
  }
  
  gameStore.setRoomName(salaSeleccionada.value);
  gameStore.manager.emit("joinRoom", {
    roomName: salaSeleccionada.value,
    userId: gameStore.userId,
    username: gameStore.username
  });
  
  // Si no es modo muerte súbita, proceder inmediatamente
  if (!sala || sala.gameMode !== 'muerte-subita') {
    proceedToJoinRoom();
  }
};

const proceedToJoinRoom = () => {
  emit("joinedRoom");
};

const actualizarSalas = (rooms) => {
  gameStore.setRooms(rooms);
};

onMounted(() => {
  const handleRoomData = (rooms) => actualizarSalas(rooms);
  gameStore.manager.on("roomData", handleRoomData);
  gameStore.manager.on("updateRooms", actualizarSalas);
  gameStore.manager.emit("getRooms");

  setTimeout(() => {
    if (gameStore.rooms.length === 0) gameStore.manager.emit("getRooms");
  }, 500);
});

onUnmounted(() => {
  delete gameStore.manager.callbacks["roomData"];
  delete gameStore.manager.callbacks["updateRooms"];
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap");

.salas-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-xl) 0;
  gap: var(--spacing-xl);
  overflow: hidden;
  background-color: var(--color-secondary);
}

/* Decorative background image */
.bg-image {
  position: absolute;
  height: 100%;
  left: 70%;
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
}

/* Title section */
.title-container {
  text-align: center;
  border-bottom: 4px solid var(--color-primary);
  width: 100%;
  max-width: 1000px;
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  z-index: 2;
}

.title {
  font-family: "Libertinus Keyboard", serif;
  font-size: 4rem;
  text-transform: uppercase;
  letter-spacing: 8px;
  position: relative;
  margin: 0;
  text-align: center;
  color: var(--color-primary);
  text-shadow: var(--shadow-sm);
}

/* Newspaper border */
.newspaper {
  border: 4px solid var(--color-primary);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 1000px;
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  z-index: 2;
  column-count: 2;
  column-gap: var(--spacing-xl);
  display: flex;
  flex-direction: column;
}

/* Article when no rooms */
.no-salas-article {
  background: var(--bg-card);
  border: 2px solid var(--color-primary);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  break-inside: avoid;
  text-align: justify;
  font-size: 1.1rem;
  color: var(--text-secondary);
}
.no-salas-article h2 {
  font-size: 1.8rem;
  text-transform: uppercase;
  border-bottom: 2px solid var(--color-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

/* Grid layout for rooms */
.salas-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
  break-inside: avoid;
}

/* Newspaper style buttons */
.sala-btn {
  background: var(--bg-card);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
  color: var(--color-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-base), transform var(--transition-base);
  font-family: "Playfair Display", serif;
  position: relative;
  break-inside: avoid;
}

.sala-btn:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
}

.sala-btn.selected {
  background: color-mix(in srgb, var(--bg-card) 70%, var(--color-secondary) 30%);
  transform: translateY(-3px);
  border: 2px solid var(--color-primary);
}

.sala-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sala-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sala-info-left {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sala-nombre {
  font-weight: 700;
  font-size: 1.6rem;
  text-transform: uppercase;
}

.gamemode-badge {
  display: inline-block;
  background: color-mix(in srgb, var(--color-danger) 55%, var(--color-primary) 45%);
  color: var(--text-white);
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-sm);
  width: fit-content;
}

.sala-capacidad {
  font-size: 1rem;
  color: var(--text-muted);
}

.player-column {
  border-left: 2px solid var(--color-primary);
  padding-left: var(--spacing-lg);
}

.player-count {
  font-weight: var(--font-weight-bold);
  font-size: 2em;
}

/* Full room styles */
.sala-btn.full {
  background: color-mix(in srgb, var(--bg-card) 70%, var(--text-muted) 30%);
  opacity: 0.7;
  cursor: not-allowed;
  color: var(--text-muted);
}

.sala-btn.full:hover {
  background: color-mix(in srgb, var(--bg-card) 70%, var(--text-muted) 30%);
  transform: none;
}

.full-badge {
  display: inline-block;
  background: var(--color-warning);
  color: var(--text-white);
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  margin-left: 0.5rem;
  letter-spacing: 1px;
  box-shadow: var(--shadow-sm);
}

/* Enter game button */
.unirse-container {
  margin-top: var(--spacing-xl);
  z-index: 3;
}

.play-button {
  font-family: "Playfair Display", serif;
  font-size: 1.3rem;
  letter-spacing: 1px;
}

/* Back button */
.back-button {
  position: fixed;
  left: 5vw;
  bottom: 6vh;
  z-index: 9999;
}

.back-button i {
  font-size: 1.5rem;
  color: inherit;
}

/* Responsive */
@media (max-width: 900px) {
  .newspaper {
    column-count: 1;
    max-width: 90%;
  }
  .title {
    font-size: 3.2rem;
  }
}
</style>
