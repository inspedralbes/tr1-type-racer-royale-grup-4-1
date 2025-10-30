<template>
  <div class="user-lobby-container">
    <button class="back-button" aria-label="Volver" @click="emit('back')">
      <i class="fa-solid fa-arrow-left"></i>
    </button>

    <h1 class="title">{{ nombreSala }}</h1>
    
    <div class="players-container">
      <h2 class="subtitle">Jugadores en la sala ({{ jugadores.length }}/{{ maxJugadores }})</h2>
      
      <div class="players-grid">
        <div 
          v-for="(jugador, index) in jugadores" 
          :key="jugador.id"
          class="player-card"
        >
          <div class="player-number">{{ index + 1 }}</div>
          <div class="player-info">
            <i class="fa-solid fa-user player-icon"></i>
            <span class="player-name">{{ jugador.username }}</span>
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

    <div class="actions">
      <button class="btn btn-start" @click="iniciarJuego" :disabled="jugadores.length < 4">
        Iniciar Juego
      </button>
      <p v-if="jugadores.length < 4" class="info-text">
        Se necesitan 4 jugadores para iniciar ({{ jugadores.length }}/4)
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(['back', 'startGame']);
const gameStore = useGameStore();

const maxJugadores = ref(4);
const jugadores = ref([]);
const nombreSala = computed(() => gameStore.currentRoom || 'Sala');

const slotsVacios = computed(() => {
  return maxJugadores.value - jugadores.value.length;
});

// Actualizar jugadores cuando el servidor envía datos
const actualizarJugadores = (rooms) => {
  const salaActual = rooms.find(r => r.name === gameStore.currentRoom);
  if (salaActual) {
    jugadores.value = salaActual.players;
    console.log('Jugadores actualizados:', jugadores.value);
  }
};

const iniciarJuego = () => {
  if (jugadores.value.length < 4) {
    alert('Se necesitan 4 jugadores para iniciar');
    return;
  }
  // Emitir al servidor para que todos los jugadores inicien
  gameStore.manager.emit('gameStart');
  console.log('Iniciando juego...');
  // Navegar localmente a GameEngine
  emit('startGame');
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
  
  // Escuchar cuando el servidor emite gameStart (otro jugador inició)
  gameStore.manager.on('gameStart', () => {
    console.log('Juego iniciado por otro jugador');
    emit('startGame');
  });
});

onUnmounted(() => {
  // No eliminar los callbacks, solo dejar de usarlos
  console.log('UserLobby desmontado');
});
</script>

<style scoped>
.user-lobby-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
  position: relative;
  padding: 2rem;
}

.title {
  font-size: 3rem;
  color: #222020;
  margin: 0;
  font-weight: bold;
  text-transform: uppercase;
}

.subtitle {
  font-size: 1.5rem;
  color: #222020;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.players-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.players-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #ffffff;
  padding: 1.5rem;
  border: 2px solid #d0d0d0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.player-card:not(.empty) {
  border-color: #4CAF50;
}

.player-card.empty {
  opacity: 0.5;
  border-style: dashed;
}

.player-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #4CAF50;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1.2rem;
}

.player-card.empty .player-number {
  background-color: #d0d0d0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.player-icon {
  font-size: 1.5rem;
  color: #222020;
}

.player-card.empty .player-icon {
  color: #999999;
}

.player-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #222020;
}

.player-card.empty .player-name {
  color: #999999;
  font-style: italic;
}

.actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.info-text {
  color: #666666;
  font-size: 1.1rem;
  margin: 0;
  font-style: italic;
}

.btn-start {
  padding: 1.2rem 4rem;
  font-size: 1.6rem;
  background-color: #4CAF50;
  color: white;
}

.btn-start:hover:not(:disabled) {
  background-color: #45a049;
  transform: scale(1.05);
}

.btn-start:disabled {
  background-color: #d0d0d0;
  color: #666666;
  cursor: not-allowed;
  transform: none;
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
}

.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.back-button i {
  font-size: 1.25rem;
}
</style>
