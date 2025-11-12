<template>
  <div class="lobby">
    <Config />

    <div class="greeting">
      <span>Hola, {{ gameStore.username || 'reporter' }}</span>
      <span>Quants articles farem avui?</span>
    </div>

    <div class="actions">
      <button class="btn btn-primary lobby-button" @click="handleCreateRoom">Crear sala</button>
      <button class="btn btn-primary lobby-button" @click="handleJoinRoom">Unirse sala</button>
    </div>

    <button class="btn-icon back-button" aria-label="Volver" @click="gameStore.playClickSound(); emit('back')">
      <i class="fa-solid fa-house"></i>
    </button>
  </div>
</template>

<script setup>
import Config from './Config.vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const emit = defineEmits(['back', 'createRoom', 'joinRoom']);

function handleCreateRoom() {
  emit('createRoom');
}

function handleJoinRoom() {
  // Enviar el username al servidor
  if (gameStore.username) {
    gameStore.manager.emit('saveUsername', gameStore.username);
  }

  // Configurar los listeners para actualización de salas
  gameStore.manager.on('roomData', (rooms) => {
    console.log('roomData recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  gameStore.manager.on('updateRooms', (rooms) => {
    console.log('updateRooms recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  // Solicitar la lista de salas disponibles
  gameStore.manager.emit('getRooms');
  
  // Navegar a la vista de salas
  emit('joinRoom');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;600&display=swap');

.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  height: 100vh;
  width: 100%;
  background: url('@/img/bgimage.png') no-repeat center center;
  background-size: cover;
  font-family: 'Poppins', sans-serif;
  position: relative;
}

.actions {
  position: absolute;
  top: 40%;
  right: 20%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-end;
}

.lobby-button {
  width: clamp(240px, 22vw, 280px);
  font-family: "Playfair Display", serif;
}

.actions .lobby-button:first-child {
  align-self: flex-start;
  margin-left: -5rem;
}

.back-button {
  position: absolute;
  left: 5vw;
  bottom: 6vh;
  height: 56px;
}

.back-button i {
  font-size: 1.25rem;
}

.greeting {
  position: absolute;
  top: 30%;
  left: 7%;
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  font-family: 'Poppins', sans-serif;
  color: var(--color-primary);
  text-transform: capitalize;
  text-shadow: var(--shadow-sm);
}

.greeting span:first-child {
  font-size: 2.1rem;
  font-weight: 700;
}

.greeting span:last-child {
  font-size: 1.4rem;
  font-weight: 400;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    gap: 1.5rem;
  }

  .lobby-button {
    width: 220px;
  }
}
</style>
