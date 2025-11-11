<template>
  <Config />
  <div class="salas-container">
    <!-- Decorative image -->
    <img src="@/img/table-with-coffee.png" alt="decor" class="bg-image" />

    <!-- Home button -->
    <button class="back-button" aria-label="Volver" @click="emit('back')">
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
          @click="seleccionarSala(sala.id)"
          :disabled="sala.isFull"
        >
          <div class="sala-content">
            <div class="sala-nombre">
              {{ sala.nombre }}
              <span v-if="sala.isFull" class="full-badge">LLENA</span>
            </div>
            <div class="sala-playercount player-column">
              <span class="player-count"
                >{{ sala.jugadores }}/{{ sala.maxPlayers }}</span
              >
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Join button -->
    <div class="unirse-container">
      <button
        class="play-button"
        :disabled="!salaSeleccionada"
        @click="unirseASala"
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
// CÓDIGO ANTERIOR: const maxJugadoresPorSala = ref(4);
// MODIFICADO: Ya no es necesario porque cada sala tiene su propio maxPlayers
const salaSeleccionada = ref(null);

const salasFiltradas = computed(() =>
  gameStore.rooms
    .filter((sala) => sala.status !== 'playing') // Filtrar salas que están jugando
    .map((sala) => ({
      id: sala.name,
      nombre: sala.name,
      jugadores: sala.players.length,
      // CÓDIGO ANTERIOR: isFull: sala.players.length >= maxJugadoresPorSala.value,
      // MODIFICADO: Ahora usa el maxPlayers específico de cada sala (con fallback a 4)
      maxPlayers: sala.maxPlayers || 4,
      isFull: sala.players.length >= (sala.maxPlayers || 4),
    })),
);

const seleccionarSala = (salaId) => {
  salaSeleccionada.value = salaId;
};

const unirseASala = () => {
  if (!salaSeleccionada.value) return;
  gameStore.setRoomName(salaSeleccionada.value);
  gameStore.manager.emit("joinRoom", salaSeleccionada.value);
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Playfair Display", serif;
  overflow: hidden;
  padding: 4rem 2rem;
  color: var(--text-color, #111);
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
  border-bottom: 4px solid #000;
  width: 100%;
  max-width: 1000px;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  z-index: 2;
}

.title {
  font-size: 5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #000;
  text-shadow: 1px 1px 0 #444;
}

/* Newspaper border */
.newspaper {
  border: 4px solid #000;
  padding: 2rem;
  width: 100%;
  max-width: 1000px;
  background: var(--paper-color, #fffef8);
  box-shadow: 8px 8px 0 #000;
  z-index: 2;
  column-count: 2;
  column-gap: 2rem;
  display: flex;
  flex-direction: column;
}

/* Article when no rooms */
.no-salas-article {
  background: #fffef8;
  border: 2px solid #000;
  padding: 2rem;
  box-shadow: 3px 3px 0 #000;
  break-inside: avoid;
  text-align: justify;
  font-size: 1.1rem;
  color: #222;
}
.no-salas-article h2 {
  font-size: 1.8rem;
  text-transform: uppercase;
  border-bottom: 2px solid #000;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

/* Grid layout for rooms */
.salas-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  break-inside: avoid;
}

/* Newspaper style buttons */
.sala-btn {
  background: #fffef8;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 #000;
  color: #000;
  padding: 1rem 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Playfair Display", serif;
  position: relative;
  break-inside: avoid;
}

.sala-btn:hover {
  background: #f0ead6;
  transform: scale(1.01);
}

.sala-btn.selected {
  background: #ede2b1;
  transform: scale(1.02);
  border: 2px solid #333;
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

.sala-nombre {
  font-weight: 700;
  font-size: 1.6rem;
  text-transform: uppercase;
}

.sala-capacidad {
  font-size: 1rem;
  color: #333;
}

.player-column {
  border-left: 2px solid #000;
  padding-left: 1.5rem;
}

.player-count {
  font-weight: bolder;
  font-size: 2em;
}

/* Full room styles */
.sala-btn.full {
  background: #d3d3d3;
  opacity: 0.6;
  cursor: not-allowed;
}

.sala-btn.full:hover {
  background: #d3d3d3;
  transform: none;
}

.full-badge {
  display: inline-block;
  background: #ff4444;
  color: white;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 4px;
  margin-left: 0.5rem;
  letter-spacing: 1px;
  box-shadow: 2px 2px 0 #000;
}

/* Enter game button */
.unirse-container {
  margin-top: 2rem;
  z-index: 3;
}

.play-button {
  background: #000;
  color: #fff;
  font-family: "Playfair Display", serif;
  border: 3px solid #000;
  padding: 0.8rem 2.2rem;
  font-size: 1.3rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
}

.play-button:hover {
  background: #fff;
  color: #000;
  transform: scale(1.05);
}

.play-button:disabled {
  background: #aaa;
  color: #444;
  cursor: not-allowed;
}

/* Back button */
.back-button {
  position: fixed;
  left: 5vw;
  bottom: 6vh;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 50px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}
.back-button i {
  font-size: 1.5rem;
  color: #000;
}

.back-button:hover {
  background: #fff;
  color: #000;
  transform: scale(1.1);
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
