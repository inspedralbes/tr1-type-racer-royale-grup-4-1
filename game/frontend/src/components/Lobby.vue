<template>
  <div class="lobby">
    <Config />

    <div class="actions">
      <button class="lobby-button" @click="handleCreateRoom">Crear sala</button>
      <button class="lobby-button" @click="handleJoinRoom">Unirse sala</button>
    </div>

    <button class="back-button" aria-label="Volver" @click="emit('back')">
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
  display: flex;
  gap: 2.5rem;
}

.lobby-button {
  padding: 1rem 2.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: #fff;
  background: rgba(91, 63, 27, 0.92);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
}

.lobby-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.32);
}

.lobby-button:active {
  transform: translateY(1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.back-button {
  position: absolute;
  left: 5vw;
  bottom: 6vh;
  width: 56px;
  height: 48px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  color: #2f2314;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-button:hover {
  transform: scale(1.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
}

.back-button:active {
  transform: scale(0.95);
}

.back-button i {
  font-size: 1.25rem;
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
