<template>
  <div class="lobby">
    <h1 class="title">Lobby</h1>

    <input
      v-if="!hasNameSaved"
      v-model="playerName"
      type="text"
      placeholder="Introduce tu nombre"
      class="name-input"
      maxlength="20"
      @keypress="handleKeyPress"
    />
    <p v-else class="welcome-text">Bienvenido, {{ gameStore.username }}</p>

    <div v-if="hasNameSaved" class="actions">
      <button class="btn" @click="handleCreateRoom">CREAR SALA</button>
      <button class="btn" @click="handleJoinRoom">UNIRSE SALA</button>
    </div>

    <button class="back-button" aria-label="Volver" @click="emit('back')">
      <i class="fa-solid fa-house" ></i>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const playerName = ref("");
const hasNameSaved = ref(false);
const emit = defineEmits(['back', 'createRoom', 'joinRoom']);

// Cargar el nombre del usuario guardado al montar el componente
onMounted(() => {
  if (gameStore.username) {
    playerName.value = gameStore.username;
    hasNameSaved.value = true;
  }
});

function savePlayerName() {
  if (playerName.value.trim()) {
    // Guardar en el store
    gameStore.setUsername(playerName.value.trim());
    // Marcar que el nombre está guardado
    hasNameSaved.value = true;
    // Emitir al servidor
    gameStore.manager.emit("saveUsername", playerName.value.trim());
    console.log('Username guardado:', playerName.value.trim());
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    savePlayerName();
  }
}

function handleCreateRoom() {
  // El nombre ya está guardado porque los botones solo se muestran si hasNameSaved es true
  emit('createRoom');
}

function handleJoinRoom() {
  if (!playerName.value.trim()) {
    alert('Por favor, introduce tu nombre');
    return;
  }
  
  // Registrar los listeners ANTES de guardar el nombre
  gameStore.manager.on('roomData', (rooms) => {
    console.log('roomData recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  gameStore.manager.on('updateRooms', (rooms) => {
    console.log('updateRooms recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  savePlayerName();
  
  // Crear sala por defecto si no existe
  gameStore.manager.emit('createRoom', 'Sala Principal');
  
  // Esperar a que lleguen las salas
  setTimeout(() => {
    emit('joinRoom');
  }, 300);
}

</script>

<style scoped>
.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
  position: relative;
}

.title {
  /* Igual que FirstPage.vue */
  font-size: 4rem;
  color: #222020;
  margin: 0;
  font-weight: bold;
}

.name-input {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #ffffff;
  color: #000000;
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  text-align: center;
  width: 300px;
  transition: all 0.3s ease;
}

.welcome-text {
  font-size: 1.5rem;
  color: #222020;
  font-weight: 600;
  margin: 0;
}



.actions {
  display: flex;
  gap: 6rem;
}

.btn {
  /* Reusa estilos de .play-button en FirstPage.vue */
  padding: 1rem 3rem;
  font-size: 1.5rem;
  background-color: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn:hover {
  /* Igual que .play-button:hover */
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.btn:active {
  /* Igual que .play-button:active */
  transform: scale(0.98);
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