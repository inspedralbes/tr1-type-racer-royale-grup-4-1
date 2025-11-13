<template>
  <BaseScreen class="user-lobby-container" @home="handleBack">
    <section class="hero">
      <h1 class="hero-title">{{ nombreSala }}</h1>
    </section>
    
    <div class="players-container card-paper">
      <h2 class="subtitle">Jugadores en la sala ({{ jugadores.length }}/{{ maxJugadores }})</h2>
      
      <div class="players-grid">
        <div 
          v-for="(jugador, index) in jugadores" 
          :key="jugador.id"
          :class="['player-card', { ready: jugador.status === 'ready' }]"
        >
          <div class="player-number">{{ index + 1 }}</div>
          <div class="player-avatar">
            <img 
              :src="getProfileImageUrl(jugador.profileImage)" 
              :alt="jugador.username"
              class="avatar-img"
            />
          </div>
          <div class="player-info">
            <span class="player-name" :title="jugador.username">{{ jugador.username }}</span>
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

    <transition name="fade">
    <div v-if="showCountdown" class="countdown-overlay">
      <div class="countdown-number">{{ countdownValue }}</div>
      <div class="countdown-text">¡Preparados!</div>
    </div>
    </transition>

    <!-- Actions Container with Betting and Ready Button -->
    <div class="actions-container">
      <!-- Betting Section -->
      <div class="betting-section card-paper card-paper--compact">
        <div class="betting-title">Apuesta por ti mismo</div>
        <div class="betting-controls">
          <button class="btn btn-ghost bet-btn" @click="gameStore.playClickSound(); decreaseBet()" :disabled="currentBet <= 0">-</button>
          <div class="bet-display">
            <input 
              type="number" 
              v-model.number="currentBet" 
              @input="validateBet"
              @focus="$event.target.select()"
              class="bet-input"
              min="0"
              :max="gameStore.money"
              placeholder="0"
            />
            <span class="bet-currency">$</span>
          </div>
          <button class="btn btn-ghost bet-btn" @click="gameStore.playClickSound(); increaseBet()" :disabled="currentBet >= gameStore.money">+</button>
        </div>
        <button 
          class="btn btn-primary confirm-bet-btn" 
          @click="gameStore.playClickSound(); confirmBet()"
          :disabled="currentBet === 0 || currentBet === confirmedBet"
        >
          {{ confirmedBet > 0 ? 'Actualizar' : 'Confirmar' }}
        </button>
        <div v-if="confirmedBet > 0" class="bet-confirmed">
          ✓ Apostado: {{ confirmedBet }} $
        </div>
      </div>

      <!-- Ready Button Section -->
      <div class="actions card-paper card-paper--compact">
        <button 
          v-if="!isCurrentPlayerReady"
          class="btn btn-primary ready-button" 
          @click="gameStore.playClickSound(); toggleReady()"
          :disabled="jugadores.length < maxJugadores"
        >
          <span>
            <i class="fa-solid fa-check"></i> ESTOY LISTO
          </span>
        </button>
        <button 
          v-else
          class="btn btn-ghost ready-button not-ready" 
          @click="gameStore.playClickSound(); toggleReady()"
        >
          <span>
            <i class="fa-solid fa-xmark"></i> CANCELAR
          </span>
        </button>
        <div v-if="jugadores.length < maxJugadores" class="waiting-message">
          Esperando {{ maxJugadores - jugadores.length }} jugador(es) más...
        </div>
        <div v-if="totalPot > 0" class="pot-display">
          <div class="pot-icon">💰</div>
          <div class="pot-info">
            <span class="pot-label">Bote Total</span>
            <span class="pot-amount">{{ totalPot }} $</span>
          </div>
        </div>
      </div>
    </div>
  </BaseScreen>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import BaseScreen from './layout/BaseScreen.vue';
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

// Betting state
const currentBet = ref(0);
const confirmedBet = ref(0);
const totalPot = ref(0);
const betStep = 5;

const slotsVacios = computed(() => {
  return maxJugadores.value - jugadores.value.length;
});

// Actualizar jugadores cuando el servidor envía datos
const actualizarJugadores = (rooms) => {
  const salaActual = rooms.find(r => r.name === gameStore.currentRoom);
  if (salaActual) {
    jugadores.value = [...salaActual.players];
    // CÓDIGO ANTERIOR: maxJugadores era siempre 4
    // MODIFICADO: Ahora se actualiza con el maxPlayers de la sala (con fallback a 4)
    maxJugadores.value = salaActual.maxPlayers || 4;
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

// Betting functions
const increaseBet = () => {
  if (currentBet.value + betStep <= gameStore.money) {
    currentBet.value += betStep;
  } else {
    currentBet.value = gameStore.money;
  }
};

const decreaseBet = () => {
  if (currentBet.value - betStep >= 0) {
    currentBet.value -= betStep;
  } else {
    currentBet.value = 0;
  }
};

const validateBet = () => {
  // Asegurar que el valor sea un número válido
  if (isNaN(currentBet.value) || currentBet.value === null || currentBet.value === '') {
    currentBet.value = 0;
    return;
  }
  
  // Convertir a entero y eliminar decimales
  currentBet.value = Math.floor(currentBet.value);
  
  // Limitar al dinero disponible
  if (currentBet.value > gameStore.money) {
    currentBet.value = gameStore.money;
  }
  
  // No permitir valores negativos
  if (currentBet.value < 0) {
    currentBet.value = 0;
  }
};

const confirmBet = () => {
  // Validar antes de confirmar
  validateBet();
  
  if (currentBet.value > 0 && currentBet.value <= gameStore.money) {
    const previousBet = confirmedBet.value;
    const difference = currentBet.value - previousBet;
    
    // Verificar que el jugador tenga suficiente dinero para la diferencia
    if (difference > 0 && gameStore.money < difference) {
      alert('No tienes suficiente dinero');
      return;
    }
    
    confirmedBet.value = currentBet.value;
    gameStore.manager.emit('placeBet', {
      roomName: gameStore.currentRoom,
      amount: currentBet.value,
      previousBet: previousBet
    });
    console.log('Apuesta confirmada:', currentBet.value, 'Diferencia:', difference);
  }
};

// Helper function to get profile image URL
const getProfileImageUrl = (imagePath) => {
  // Si no hay imagen, devolver la imagen por defecto
  if (!imagePath) return 'http://localhost:3000/img/default.png';
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
    maxJugadores.value = salaActual.maxPlayers || 4;
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
  
  // Escuchar actualizaciones del bote total
  gameStore.manager.on('updateTotalPot', (pot) => {
    console.log('Bote total actualizado:', pot);
    totalPot.value = pot;
  });
  
  // Escuchar confirmación de apuesta
  gameStore.manager.on('betConfirmed', ({ success, message, newMoney }) => {
    if (success) {
      console.log('Apuesta confirmada exitosamente. Nuevo dinero:', newMoney);
      // Actualizar el dinero del jugador con el valor de la base de datos
      if (newMoney !== undefined) {
        gameStore.setMoney(newMoney);
      }
    } else {
      alert(message || 'Error al confirmar apuesta');
      currentBet.value = confirmedBet.value;
    }
  });
  
  // Escuchar devolución de apuesta al salir de la sala
  gameStore.manager.on('betRefunded', ({ newMoney }) => {
    console.log('Apuesta devuelta. Nuevo dinero:', newMoney);
    if (newMoney !== undefined) {
      gameStore.setMoney(newMoney);
    }
    confirmedBet.value = 0;
    currentBet.value = 0;
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');

.user-lobby-container {
  position: relative; 
  min-height: 100vh;
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-2xl);
  display: flex; 
  flex-direction: column; 
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--color-secondary);
  font-family: 'Poppins', sans-serif;
}

.hero {
  text-align: center;
  color: var(--text-white);
  text-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  margin-top: var(--spacing-sm);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.4rem, 5vw, 3.2rem);
  letter-spacing: 0.08rem;
  text-transform: uppercase;
  color: var(--color-primary);
}

.players-container {
  width: min(960px, 100%);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  }

.subtitle {
  margin: 0;
  font-size: 1.4rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.player-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--bg-card);
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, var(--bg-body) 70%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.player-card.ready {
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-lg);
}

.player-card:not(.empty):hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.player-card.empty {
  opacity: 0.6;
}

.player-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-round);
  background: color-mix(in srgb, var(--bg-card) 60%, var(--color-secondary) 40%);
  border: 2px solid var(--color-primary);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  color: var(--color-primary);
}

.player-icon {
  font-size: 1.4rem;
  color: var(--color-primary);
}

.player-card.empty .player-icon {
  color: var(--text-muted);
}

.player-name {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}

.player-card.empty .player-name {
  color: var(--text-muted);
  font-style: italic;
}

.player-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-round);
  background: var(--color-primary);
  color: var(--text-white);
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
}

.player-card.empty .player-number {
  background: var(--bg-hover);
  color: var(--text-muted);
}

.ready-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-secondary) 70%, var(--bg-card) 30%);
  color: var(--text-white);
  font-size: 0.85rem;
  }

.actions-container {
  width: min(960px, 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.pot-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: flex-start;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, var(--bg-body) 70%);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.pot-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  text-align: right;
}

.pot-icon {
  font-size: 1.6rem;
}

.pot-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
}

.pot-amount {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.betting-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: min(320px, 100%);
}

.betting-title {
  font-size: 0.95rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-transform: uppercase;
}

.betting-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.bet-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-round);
  padding: 0;
  font-size: 1.4rem;
}

.bet-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-primary);
  background: var(--bg-card);
  position: relative;
}

.bet-input {
  flex: 1;
  width: 100%;
  text-align: center;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Poppins', sans-serif;
}

.bet-input::-webkit-inner-spin-button,
.bet-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.bet-input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.bet-currency {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  flex-shrink: 0;
}

.bet-amount {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.confirm-bet-btn {
  width: 100%;
}

.bet-confirmed {
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  text-align: center;
}

.actions {
  width: min(320px, 100%);
  display: flex; 
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-sm);
}

.ready-button {
  justify-content: center;
}

.ready-button.not-ready {
  background: var(--bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.waiting-message {
  text-align: center;
  font-size: 0.95rem;
  color: var(--color-primary);
}

.countdown-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  z-index: 20;
}

.countdown-number {
  font-size: clamp(6rem, 18vw, 12rem);
  font-weight: 900;
  color: var(--text-white);
}

.countdown-text {
  font-size: clamp(1.5rem, 4vw, 2.4rem);
  color: var(--text-white);
  text-transform: uppercase;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-slow);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .user-lobby-container {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
  
  .actions-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .betting-section,
  .actions {
    width: 100%;
  }

  .back-button {
    top: var(--spacing-lg);
    left: var(--spacing-lg);
  }
}
</style>