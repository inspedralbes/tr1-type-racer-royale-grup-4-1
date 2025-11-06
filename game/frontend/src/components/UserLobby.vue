<template>
  <div class="user-lobby-container">
    <Config />
    
    <div class="scanlines"></div>
    
    <div class="pixel-stars">
      <div class="pixel-star" v-for="n in 20" :key="n"></div>
    </div>

    <button class="back-button" aria-label="Volver" @click="handleBack">
      <i class="fa-solid fa-house"></i>
    </button>

    <div class="title-container">
      <h1 class="title">{{ nombreSala }}</h1>
    </div>
    
    <div class="players-container">
      <h2 class="subtitle">Jugadores en la sala ({{ jugadores.length }}/{{ maxJugadores }})</h2>
      
      <div class="players-grid">
        <div 
          v-for="(jugador, index) in jugadores" 
          :key="jugador.id"
          :class="['player-card', { ready: jugador.status === 'ready' }]"
        >
          <span class="pixel-border-card"></span>
          <div class="player-number">{{ index + 1 }}</div>
          <div class="player-avatar">
            <img 
              v-if="jugador.profileImage" 
              :src="getProfileImageUrl(jugador.profileImage)" 
              :alt="jugador.username"
              class="avatar-img"
            />
            <i v-else class="fa-solid fa-user player-icon"></i>
          </div>
          <div class="player-info">
            <span class="player-name">{{ jugador.username }}</span>
            <span v-if="jugador.status === 'ready'" class="ready-badge">
              <i class="fa-solid fa-check"></i> LISTO
            </span>
          </div>
        </div>
        
        <!-- Slots vacíos -->
        <div 
          v-for="slot in slotsVacios" 
          :key="'empty-' + slot"
          class="player-card empty"
        >
          <div class="player-number">{{ jugadores.length + slot }}</div>
          <div class="player-info">
            <i class="fa-solid fa-user-slash player-icon"></i>
            <span class="player-name">Esperando...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Countdown overlay -->
    <div v-if="showCountdown" class="countdown-overlay">
      <div class="countdown-number">{{ countdownValue }}</div>
      <div class="countdown-text">¡Preparados!</div>
    </div>

    <div class="actions">
      <button 
        v-if="!isCurrentPlayerReady"
        class="ready-button" 
        @click="toggleReady"
        :disabled="jugadores.length < maxJugadores"
      >
        <span class="pixel-border"></span>
        <span class="button-text">
          <i class="fa-solid fa-check"></i> ESTOY LISTO
        </span>
        <div class="button-pixels"></div>
      </button>
      <button 
        v-else
        class="ready-button not-ready" 
        @click="toggleReady"
      >
        <span class="pixel-border"></span>
        <span class="button-text">
          <i class="fa-solid fa-xmark"></i> CANCELAR
        </span>
        <div class="button-pixels"></div>
      </button>
      <div v-if="jugadores.length < maxJugadores" class="waiting-message">
        Esperando {{ maxJugadores - jugadores.length }} jugador(es) más...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Config from './Config.vue';
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(['back', 'startGame']);
const gameStore = useGameStore();

const maxJugadores = ref(4);
const jugadores = ref([]);
const nombreSala = computed(() => gameStore.currentRoom || 'Sala');
const isCurrentPlayerReady = ref(false);
const showCountdown = ref(false);
const countdownValue = ref(3);
let countdownInterval = null;

const slotsVacios = computed(() => {
  return maxJugadores.value - jugadores.value.length;
});

// Actualizar jugadores cuando el servidor envía datos
const actualizarJugadores = (rooms) => {
  const salaActual = rooms.find(r => r.name === gameStore.currentRoom);
  if (salaActual) {
    jugadores.value = [...salaActual.players];
  } else {
    // Si la sala ya no existe, volver al lobby
    emit('back');
  }
  console.log('Jugadores actualizados:', jugadores.value);
};

// Manejar el botón de volver
const handleBack = () => {
  // Limpiar el countdown si existe
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    showCountdown.value = false;
  }
  
  // Notificar al servidor que el jugador está saliendo de la sala
  if (gameStore.currentRoom) {
    console.log(`Saliendo de la sala: ${gameStore.currentRoom}`);
    gameStore.manager.emit('leaveRoom', gameStore.currentRoom);
  }
  // Limpiar la sala actual
  gameStore.setRoomName('');
  // Navegar hacia atrás
  emit('back');
};

const toggleReady = () => {
  isCurrentPlayerReady.value = !isCurrentPlayerReady.value;
  gameStore.manager.emit('playerReady', isCurrentPlayerReady.value);
  console.log('Estado listo:', isCurrentPlayerReady.value);
};

const startCountdown = () => {
  // Limpiar cualquier countdown anterior
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  showCountdown.value = true;
  countdownValue.value = 3;
  
  countdownInterval = setInterval(() => {
    countdownValue.value--;
    
    if (countdownValue.value === 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      showCountdown.value = false;
      // Iniciar el juego
      emit('startGame');
    }
  }, 1000);
};

// Helper function to get profile image URL
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // Si ya es una URL completa, devolverla tal cual
  if (imagePath.startsWith('http')) return imagePath;
  // Si es una ruta relativa, construir la URL completa
  return `http://localhost:3000${imagePath}`;
};

onMounted(() => {
  console.log('UserLobby montado. Sala:', gameStore.currentRoom);
  
  // Obtener jugadores actuales de la sala
  const salaActual = gameStore.rooms.find(r => r.name === gameStore.currentRoom);
  if (salaActual) {
    jugadores.value = salaActual.players;
  }
  
  // Escuchar actualizaciones de salas
  gameStore.manager.on('updateRooms', actualizarJugadores);
  gameStore.manager.on('roomData', actualizarJugadores);
  
  // Escuchar cuando todos están listos y comienza la cuenta regresiva
  gameStore.manager.on('startCountdown', () => {
    console.log('Todos los jugadores están listos. Iniciando cuenta regresiva...');
    startCountdown();
  });
  
  // Actualizar la lista completa de jugadores en tiempo real
  gameStore.manager.on('updateRoomPlayers', (players) => {
    console.log('Actualizando jugadores en tiempo real:', players);
    // Crear una copia profunda para forzar la reactividad
    jugadores.value = players.map(p => ({
      id: p.id,
      username: p.username,
      userId: p.userId,
      profileImage: p.profileImage,
      status: p.status,
      room: p.room
    }));
    
    // También actualizar el estado del jugador actual
    const currentPlayer = players.find(p => p.id === gameStore.manager.socket?.id);
    if (currentPlayer) {
      isCurrentPlayerReady.value = currentPlayer.status === 'ready';
    }
    
    console.log('Estados de jugadores:', jugadores.value.map(j => ({ username: j.username, status: j.status })));
  });
  
  // Escuchar cuando un jugador abandona la sala
  gameStore.manager.on('playerLeft', ({ playerId, roomName }) => {
    console.log(`Jugador ${playerId} abandonó la sala ${roomName}`);
    // El estado se actualizará automáticamente con updateRoomPlayers
  });
});

onUnmounted(() => {
  // Limpiar el countdown si existe
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  // No eliminar los callbacks, solo dejar de usarlos
  console.log('UserLobby desmontado');
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');

.user-lobby-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100vh; max-height: 100vh; gap: 2rem;
  position: fixed; inset: 0;
  overflow: hidden;
  font-family: 'Poppins', sans-serif;
  padding: 2rem;
  background-size: cover;
  box-sizing: border-box;
  width: 100%;
}

/* Scanlines CRT effect */
.scanlines {
  position: fixed; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.04) 3px);
  animation: scanlineMove 8s linear infinite;
  z-index: 10;
}
@keyframes scanlineMove { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

/* Title with glitch & float */
.title-container {
  position: relative; 
  display: flex; 
  flex-direction: column; 
  align-items: center;
  animation: glitchContainer 5s infinite; 
  z-index: 5;
  margin-bottom: 2rem;
}
.title {
  font-size: 4rem; font-weight: 900; margin: 0; line-height: 1;
  text-transform: uppercase;
  color: #FFD700;
  text-shadow:
    -1px -1px 0 #000, 0 -1px 0 #000, 1px -1px 0 #000, 1px 0 0 #000,
    1px 1px 0 #000, 0 1px 0 #000, -1px 1px 0 #000, -1px 0 0 #000,
    0 0 8px rgba(0,0,0,0.5);
  animation: titleGlitch 3s infinite, titleFloat 4s ease-in-out infinite;
}
@keyframes glitchContainer { 0%,90%,100% {transform:translate(0,0);} 91%{transform:translate(-2px,1px);} 92%{transform:translate(2px,-1px);} 93%{transform:translate(-1px,2px);} 94%{transform:translate(1px,-2px);} }
@keyframes titleGlitch { 0%,85%,100% { transform: skew(0deg); } 86% { transform: skew(-1deg); } 88% { transform: skew(1deg); } 90% { transform: skew(0deg); } }
@keyframes titleFloat { 0%,100% {transform:translateY(0);} 50% {transform:translateY(-10px);} }

/* Pixel stars - Full screen particles */
.pixel-stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.pixel-star {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #FFA500;
  box-shadow: 0 0 10px #FFA500, inset 0 0 5px #fff;
  animation: pixelStarBlink 3s ease-in-out infinite;
  opacity: 0.7;
}

/* Generate random positions for stars */
.pixel-star:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.pixel-star:nth-child(2) { top: 20%; left: 20%; animation-delay: 0.5s; }
.pixel-star:nth-child(3) { top: 30%; left: 30%; animation-delay: 1s; }
.pixel-star:nth-child(4) { top: 40%; left: 40%; animation-delay: 1.5s; }
.pixel-star:nth-child(5) { top: 50%; left: 50%; animation-delay: 2s; }
.pixel-star:nth-child(6) { top: 60%; left: 60%; animation-delay: 2.5s; }
.pixel-star:nth-child(7) { top: 70%; left: 70%; animation-delay: 3s; }
.pixel-star:nth-child(8) { top: 80%; left: 80%; animation-delay: 0.8s; }
.pixel-star:nth-child(9) { top: 90%; left: 20%; animation-delay: 1.2s; }
.pixel-star:nth-child(10) { top: 15%; left: 75%; animation-delay: 1.8s; }
.pixel-star:nth-child(11) { top: 25%; left: 5%; animation-delay: 2.2s; }
.pixel-star:nth-child(12) { top: 35%; left: 85%; animation-delay: 0.3s; }
.pixel-star:nth-child(13) { top: 45%; left: 15%; animation-delay: 1.7s; }
.pixel-star:nth-child(14) { top: 55%; left: 90%; animation-delay: 2.8s; }
.pixel-star:nth-child(15) { top: 65%; left: 10%; animation-delay: 0.6s; }
.pixel-star:nth-child(16) { top: 75%; left: 95%; animation-delay: 1.9s; }
.pixel-star:nth-child(17) { top: 85%; left: 5%; animation-delay: 2.4s; }
.pixel-star:nth-child(18) { top: 5%; left: 50%; animation-delay: 0.9s; }
.pixel-star:nth-child(19) { top: 25%; left: 60%; animation-delay: 2.1s; }
.pixel-star:nth-child(20) { top: 45%; left: 30%; animation-delay: 1.3s; }
@keyframes pixelStarBlink {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(0.8) rotate(0deg); 
  }
  50% { 
    opacity: 0.9; 
    transform: scale(1.2) rotate(180deg); 
  }
}

/* Subtitle */
.subtitle {
  font-size: 1.8rem; color: #fff; margin: 0 0 1.5rem; font-weight: 700;
  text-shadow:
    -1px -1px 0 #000, 0 -1px 0 #000, 1px -1px 0 #000, 1px 0 0 #000,
    1px 1px 0 #000, 0 1px 0 #000, -1px 1px 0 #000, -1px 0 0 #000,
    0 0 10px rgba(0,0,0,0.5);
  z-index: 5;
}

/* Players container and grid */
.players-container {
  width: 100%; max-width: 800px; display: flex; flex-direction: column; align-items: center; z-index: 5;
}
.players-grid {
  width: 100%; display: grid; grid-template-columns: repeat(2,1fr); gap: 1.5rem;
}
.player-card {
  display: flex; align-items: center; gap: 1rem;
  background-color: rgba(255, 140, 0, 0.95);
  padding: 1.5rem; border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  animation: cardPulse 2s ease-in-out infinite;
  position: relative; overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
@keyframes cardPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 6px 20px rgba(255,140,0,0.4); }
}
.player-card:not(.empty):hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(255,140,0,0.6);
}
.player-card.empty {
  background-color: rgba(208,208,208,0.6);
  opacity: 0.7;
  animation: none;
}
.pixel-border-card {
  position: absolute; inset: 2px;
  border-radius: 25px; border: 2px dashed #FFA500;
  animation: borderDash 1s linear infinite;
}
.player-card.empty .pixel-border-card { display: none; }
@keyframes borderDash {
  0%,100% { border-color: #FFA500; }
  50% { border-color: #fff; }
}
.player-number {
  display: flex; align-items: center; justify-content: center;
  width: 50px; height: 50px;
  background-color: #FFD700; color: #000;
  border-radius: 50%;
  font-weight: 900; font-size: 1.5rem; z-index: 2;
  box-shadow: 0 0 15px rgba(255,215,0,0.6);
}
.player-card.empty .player-number {
  background-color: #999; color: #666; box-shadow: none;
}
.player-info {
  display: flex; align-items: center; gap: 0.75rem; flex: 1; z-index: 2;
}
.player-icon {
  font-size: 1.8rem; color: #fff;
}
.player-card.empty .player-icon {
  color: #666;
}
.player-name {
  font-size: 1.4rem; font-weight: 700; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.player-card.empty .player-name {
  color: #666; font-style: italic; text-shadow: none;
}

.player-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 215, 0, 0.3);
  border: 2px solid #FFD700;
  z-index: 2;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.player-card.ready {
  background-color: rgba(50, 205, 50, 0.95);
  box-shadow: 0 4px 15px rgba(50, 205, 50, 0.4);
  animation: readyCardPulse 2s ease-in-out infinite;
}

.player-card.ready:hover {
  box-shadow: 0 8px 25px rgba(50, 205, 50, 0.6);
}

@keyframes readyCardPulse {
  0%, 100% { 
    box-shadow: 0 4px 15px rgba(50, 205, 50, 0.4);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 6px 25px rgba(50, 205, 50, 0.8);
    transform: scale(1.02);
  }
}

.ready-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  margin-left: 0.5rem;
  animation: readyPulse 1.5s ease-in-out infinite;
}

@keyframes readyPulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  }
}

/* Countdown overlay */
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease-in-out;
}

.countdown-number {
  font-size: 15rem;
  font-weight: 900;
  color: #FFD700;
  text-shadow:
    -3px -3px 0 #000, 0 -3px 0 #000, 3px -3px 0 #000, 3px 0 0 #000,
    3px 3px 0 #000, 0 3px 0 #000, -3px 3px 0 #000, -3px 0 0 #000,
    0 0 30px rgba(255, 215, 0, 0.8);
  animation: countdownScale 1s ease-in-out;
}

@keyframes countdownScale {
  0% { 
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% { 
    transform: scale(1);
    opacity: 1;
  }
}

.countdown-text {
  font-size: 3rem;
  font-weight: 700;
  color: #FFA500;
  text-transform: uppercase;
  margin-top: 2rem;
  text-shadow:
    -2px -2px 0 #000, 0 -2px 0 #000, 2px -2px 0 #000, 2px 0 0 #000,
    2px 2px 0 #000, 0 2px 0 #000, -2px 2px 0 #000, -2px 0 0 #000;
}

/* Actions & ready button */
.actions {
  margin-top: 2rem; 
  display: flex; 
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 5;
}

.ready-button {
  padding: 1.2rem 4rem; font-size: 1.6rem; font-weight: 700;
  color: #fff; background-color: #32CD32; border: none; border-radius: 50px;
  cursor: pointer; position: relative; overflow: hidden;
  text-transform: uppercase; letter-spacing: 1.5px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  animation: buttonPulse 1.5s ease-in-out infinite;
}

.ready-button.not-ready {
  background-color: #FF4444;
  animation: none;
}

.waiting-message {
  color: #FFD700;
  font-size: 1.2rem;
  font-weight: 700;
  text-shadow:
    -1px -1px 0 #000, 0 -1px 0 #000, 1px -1px 0 #000, 1px 0 0 #000,
    1px 1px 0 #000, 0 1px 0 #000, -1px 1px 0 #000, -1px 0 0 #000;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5;  }
}
.play-button {
  padding: 1.2rem 4rem; font-size: 1.6rem; font-weight: 700;
  color: #fff; background-color: #FF8C00; border: none; border-radius: 50px;
  cursor: pointer; position: relative; overflow: hidden;
  text-transform: uppercase; letter-spacing: 1.5px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  animation: buttonPulse 1.5s ease-in-out infinite;
}
@keyframes buttonPulse {
  0%,100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  50% { box-shadow: 0 6px 25px rgba(255,140,0,0.5); }
}
.play-button .pixel-border {
  position: absolute; inset: 2px;
  border-radius: 50px;
  border: 2px dashed #FFA500;
  animation: borderDash 1s linear infinite;
}
.button-text {
  position: relative; z-index: 2;
  animation: textGlow 1.5s ease-in-out infinite;
}
@keyframes textGlow {
  0%,100% { text-shadow: 0 0 5px #fff; }
  50% { text-shadow: 0 0 20px #fff; }
}
.button-pixels {
  position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px);
  animation: pixelScan 1.2s linear infinite;
}
@keyframes pixelScan {
  0% { left: -100%; }
  100% { left: 100%; }
}
.play-button:hover {
  background-color: #FFA500;
  transform: translateY(-5px) translateX(-2px);
  box-shadow: 0 8px 30px rgba(255,140,0,0.6);
}
.play-button:hover .button-text {
  animation: textFlicker 0.1s ease-in-out infinite;
}
@keyframes textFlicker {
  0%,100% { opacity: 1; }
  50% { opacity: 0.9; }
}
.play-button:active {
  transform: translateY(2px) translateX(1px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.play-button:disabled {
  background-color: #d0d0d0; color: #666; cursor: not-allowed;
  transform: none; animation: none;
}
.play-button:disabled .pixel-border,
.play-button:disabled .button-pixels {
  display: none;
}

.ready-button:hover {
  background-color: #3AE03A;
  transform: translateY(-5px) translateX(-2px);
  box-shadow: 0 8px 30px rgba(50, 205, 50, 0.6);
}

.ready-button.not-ready:hover {
  background-color: #FF5555;
  box-shadow: 0 8px 30px rgba(255, 68, 68, 0.6);
}

.ready-button:hover .button-text {
  animation: textFlicker 0.1s ease-in-out infinite;
}

.ready-button:active {
  transform: translateY(2px) translateX(1px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.ready-button:disabled {
  background-color: #d0d0d0; 
  color: #666; 
  cursor: not-allowed;
  transform: none; 
  animation: none;
  opacity: 0.5;
}

.ready-button:disabled .pixel-border,
.ready-button:disabled .button-pixels {
  display: none;
}

/* Back button */
.back-button {
  position: absolute; left: 5vw; bottom: 6vh;
  background: rgba(255,255,255,0.9); color: #333;
  border: none; border-radius: 50px;
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  z-index: 40;
}
.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}
.back-button i {
  font-size: 1.5rem; color: #000;
}

/* Responsive */
@media (max-width: 768px) {
  .title { font-size: 3rem; }
  .subtitle { font-size: 1.4rem; }
  .players-grid { grid-template-columns: 1fr; }
  .play-button { padding: 1rem 3rem; font-size: 1.3rem; }
  .pixel-star { width: 8px; height: 8px; }
  .back-button { left: 3vw; bottom: 3vh; }
  .player-card { padding: 1.2rem; }
  .player-number { width: 40px; height: 40px; font-size: 1.2rem; }
  .player-name { font-size: 1.2rem; }
}
</style>