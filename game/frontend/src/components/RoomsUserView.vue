<template>
  <div class="salas-container">
    <Config />
    <img src="@/img/table-with-coffee.png" alt="decor" class="bg-image" />
    <div class="scanlines"></div>

    <button class="back-button" aria-label="Volver" @click="emit('back')">
      <i class="fa-solid fa-house"></i>
    </button>

    <div class="title-container">
      <div class="pixel-stars">
        <div class="pixel-star" v-for="n in 16" :key="n"></div>
      </div>

      <h1 class="title">
        <span class="word word-1">Salas</span>
      </h1>
    </div>

    <div class="salas-grid">
      <div v-if="salasFiltradas.length === 0" class="no-salas">
        <p>No hay salas disponibles en este momento</p>
      </div>
      <button
        v-for="sala in salasFiltradas"
        :key="sala.id"
        :class="['sala-btn', { selected: sala.id === salaSeleccionada }]"
        @click="seleccionarSala(sala.id)"
      >
        <span class="pixel-border"></span>
        <span class="sala-nombre">{{ sala.nombre }}</span>
        <span class="sala-capacidad"
          >{{ sala.jugadores }}/{{ maxJugadoresPorSala }}</span
        >
      </button>
    </div>

    <!-- Boton Unirse una vez seleccionada la sala -->
    <div class="unirse-container">
      <button
        class="play-button"
        :disabled="!salaSeleccionada"
        @click="unirseASala"
      >
        <span class="pixel-border"></span>
        <span class="button-text">UNIRSE</span>
        <div class="button-pixels"></div>
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

// Sala actualmente seleccionada
const salaSeleccionada = ref(null);

// Usar las salas del store
const salasFiltradas = computed(() => {
  return gameStore.rooms.map((sala) => ({
    id: sala.name,
    nombre: sala.name,
    jugadores: sala.players.length,
  }));
});

// Selecciona una sala al hacer click
const seleccionarSala = (salaId) => {
  salaSeleccionada.value = salaId;
};

// Unirse a la sala seleccionada
const unirseASala = () => {
  if (!salaSeleccionada.value) return;
  console.log("Unirse a sala:", salaSeleccionada.value);

  // Guardar el nombre de la sala en el store
  gameStore.setRoomName(salaSeleccionada.value);

  // Emitir evento para unirse a la sala en el servidor
  gameStore.manager.emit("joinRoom", salaSeleccionada.value);

  // Navegar a UserLobby
  emit("joinedRoom");
};

// Actualizar salas cuando el servidor envía datos
const actualizarSalas = (rooms) => {
  gameStore.setRooms(rooms);
  console.log("Salas actualizadas en RoomsUserView:", rooms);
};

onMounted(async () => {
  console.log("RoomsUserView montado. Salas actuales:", gameStore.rooms);

  // Configurar el listener para actualizaciones de salas
  const handleRoomData = (rooms) => {
    console.log("roomData recibido en RoomsUserView:", rooms);
    actualizarSalas(rooms);
  };

  // Configurar listeners
  gameStore.manager.on("roomData", handleRoomData);
  gameStore.manager.on("updateRooms", actualizarSalas);

  // Forzar la solicitud de salas
  console.log("Solicitando salas disponibles...");
  gameStore.manager.emit("getRooms");

  // Si no hay salas después de 500ms, volver a intentar
  setTimeout(() => {
    if (gameStore.rooms.length === 0) {
      console.log("No se recibieron salas, reintentando...");
      gameStore.manager.emit("getRooms");
    }
  }, 500);
});

onUnmounted(() => {
  // Limpiar listeners cuando el componente se desmonte
  delete gameStore.manager.callbacks["roomData"];
  delete gameStore.manager.callbacks["updateRooms"];
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap");

.salas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
  position: relative;
  overflow: hidden;
  background-size: cover;
  font-family: "Poppins", sans-serif;
  color: #333;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
}

/* Scanlines CRT effect */
.scanlines {
  position: fixed;
  inset: 0;
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
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

/* Title container with glitch */
.title-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: glitchContainer 5s infinite;
}
@keyframes glitchContainer {
  0%,
  90%,
  100% {
    transform: translate(0, 0);
  }
  91% {
    transform: translate(-2px, 1px);
  }
  92% {
    transform: translate(2px, -1px);
  }
  93% {
    transform: translate(-1px, 2px);
  }
  94% {
    transform: translate(1px, -2px);
  }
}

/* Title with glitch and float animations */
.title {
  font-size: 6rem;
  font-weight: 900;
  margin: 0;
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-transform: uppercase;
  animation:
    titleGlitch 3s infinite,
    titleFloat 4s ease-in-out infinite;
}
.word {
  display: block;
  animation: wordBlink 2s ease-in-out infinite;
}
.word-1 {
  color: white;
  text-shadow:
    -1px -1px 0 #000,
    0 -1px 0 #000,
    1px -1px 0 #000,
    1px 0 0 #000,
    1px 1px 0 #000,
    0 1px 0 #000,
    -1px 1px 0 #000,
    -1px 0 0 #000,
    0 0 10px rgba(0, 0, 0, 0.5);
  font-weight: 900;
}
@keyframes titleGlitch {
  0%,
  85%,
  100% {
    transform: skew(0deg);
  }
  86% {
    transform: skew(-1deg);
  }
  88% {
    transform: skew(1deg);
  }
  90% {
    transform: skew(0deg);
  }
}
@keyframes titleFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
@keyframes wordBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Pixel stars background */
.pixel-stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}
.pixel-star {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ffa500;
  box-shadow:
    0 0 10px #ffa500,
    inset 0 0 5px #fff;
  animation: pixelStarBlink 1.5s ease-in-out infinite;
}
/* Positions & animation delays for stars */
.pixel-star:nth-child(1) {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}
.pixel-star:nth-child(2) {
  top: 20%;
  right: 15%;
  animation-delay: 0.3s;
}
.pixel-star:nth-child(3) {
  top: 70%;
  left: 15%;
  animation-delay: 0.6s;
}
.pixel-star:nth-child(4) {
  top: 80%;
  right: 20%;
  animation-delay: 0.9s;
}
.pixel-star:nth-child(5) {
  top: 30%;
  left: 5%;
  animation-delay: 0.2s;
}
.pixel-star:nth-child(6) {
  top: 50%;
  right: 10%;
  animation-delay: 0.5s;
}
.pixel-star:nth-child(7) {
  top: 15%;
  left: 85%;
  animation-delay: 0.8s;
}
.pixel-star:nth-child(8) {
  top: 65%;
  left: 80%;
  animation-delay: 0.4s;
}
.pixel-star:nth-child(9) {
  top: 5%;
  left: 50%;
  animation-delay: 0.1s;
}
.pixel-star:nth-child(10) {
  top: 90%;
  left: 50%;
  animation-delay: 0.7s;
}
.pixel-star:nth-child(11) {
  top: 25%;
  left: 25%;
  animation-delay: 0.4s;
}
.pixel-star:nth-child(12) {
  top: 75%;
  right: 25%;
  animation-delay: 0.2s;
}
.pixel-star:nth-child(13) {
  top: 40%;
  left: 40%;
  animation-delay: 0.6s;
}
.pixel-star:nth-child(14) {
  top: 60%;
  right: 40%;
  animation-delay: 0.8s;
}
.pixel-star:nth-child(15) {
  top: 10%;
  right: 5%;
  animation-delay: 0.3s;
}
.pixel-star:nth-child(16) {
  bottom: 10%;
  left: 5%;
  animation-delay: 0.7s;
}
@keyframes pixelStarBlink {
  0%,
  50%,
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  25% {
    opacity: 0.3;
    transform: scale(1.3) rotate(45deg);
  }
  75% {
    opacity: 0.5;
    transform: scale(0.8) rotate(-45deg);
  }
}

/* Rooms grid */
.salas-grid {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 5;
}

/* Room button */
.sala-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 140, 0, 0.9);
  color: #fff;
  padding: 1.2rem 2rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  font-weight: 700;
  font-family: "Poppins", sans-serif;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: buttonPulse 1.5s ease-in-out infinite;
  background-color: #5b3f1b;
}
.sala-btn:hover {
  background-color: #ffa500;
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(255, 140, 0, 0.6);
}
.sala-btn.selected {
  background-color: #ffd700;
  color: #000;
  border: 3px solid #ffa500;
  transform: scale(1.05);
  animation: none;
}
/* Pixel border animation */
.sala-btn .pixel-border {
  position: absolute;
  inset: 2px;
  border-radius: 50px;
  /*border: 2px dashed #ffa500;
  /*animation: borderDash 1s linear infinite;*/
}
@keyframes borderDash {
  0%,
  100% {
    border-color: #ffa500;
  }
  50% {
    border-color: #fff;
  }
}

.sala-nombre,
.sala-capacidad {
  font-size: 1.5rem;
  font-weight: bold;
  position: relative;
  z-index: 2;
}

.no-salas {
  text-align: center;
  padding: 2rem;
  color: #fff;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

/* Join button container */
.unirse-container {
  margin-top: 1rem;
  z-index: 5;
}
.play-button {
  padding: 1rem 3.5rem;
  font-size: 1.2rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  color: #fff;
  background-color: #5b3f1b;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: buttonPulse 1.5s ease-in-out infinite;
}
@keyframes buttonPulse {
  0%,
  100% {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 6px 25px rgba(255, 140, 0, 0.5);
  }
}
.play-button .pixel-border {
  position: absolute;
  inset: 2px;
  border-radius: 50px;
  /*border: 2px dashed #ffa500;
  /*animation: borderDash 1s linear infinite;*/
}
.button-text {
  position: relative;
  z-index: 2;
  display: inline-block;
  animation: textGlow 1.5s ease-in-out infinite;
}
@keyframes textGlow {
  0%,
  100% {
    text-shadow: 0 0 5px #fff;
  }
  50% {
    text-shadow: 0 0 20px #fff;
  }
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
}
@keyframes pixelScan {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
.play-button:hover {
  background-color: #45a049; /* Darker green on hover */
  transform: translateY(-5px) translateX(-2px);
  box-shadow: 0 8px 30px rgba(76, 175, 80, 0.6);
}
.play-button:hover .button-text {
  animation: textFlicker 0.1s ease-in-out infinite;
}
@keyframes textFlicker {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}
.play-button:active {
  transform: translateY(2px) translateX(1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.play-button:disabled {
  background-color: #d0d0d0;
  color: #666;
  cursor: not-allowed;
  transform: none;
  animation: none;
}
.play-button:disabled .pixel-border,
.play-button:disabled .button-pixels {
  display: none;
}

/* Back button */
.back-button {
  position: absolute;
  left: 5vw;
  bottom: 6vh;
  background: #fff;
  color: #000;
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
  color: inherit;
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 4rem;
  }
  .play-button {
    padding: 0.8rem 2.5rem;
    font-size: 1rem;
  }
  .sala-btn {
    padding: 1rem 1.5rem;
  }
  .sala-nombre,
  .sala-capacidad {
    font-size: 1.2rem;
  }
  .pixel-star {
    width: 8px;
    height: 8px;
  }
  .back-button {
    left: 3vw;
    bottom: 3vh;
  }
}

.bg-image {
  z-index: 0;
  position: absolute;
  height: 100%;
  left: 65%;
}
</style>

