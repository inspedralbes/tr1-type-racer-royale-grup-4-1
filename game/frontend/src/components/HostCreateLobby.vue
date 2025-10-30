<template>
  <div class="host-create-lobby">
    <h1 class="title">CREAR SALA</h1>

    <div class="content">
      <input class="name-input" v-model="roomName" placeholder="Nombre de la sala" />
    </div>

    <div class="actions">
      <button class="btn" @click="goBack">ATRAS</button>
      <button class="btn" @click="createRoom">CREAR</button>
    </div>

    <button class="back-button" aria-label="Volver" @click="goBack">
      <i class="fa-solid fa-house"></i>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(["backToLobby", "roomCreated"]);
const gameStore = useGameStore();

const roomName = ref("");

function goBack() {
  emit("backToLobby");
}

function createRoom() {
  const name = roomName.value.trim();
  if (!name) {
    alert("Por favor introduce un nombre de sala válido.");
    return;
  }

  // Emitir al servidor para crear la sala (el backend espera solo el nombre por ahora)
  gameStore.manager.emit("createRoom", name);

  emit("roomCreated", name);
}
</script>

<style scoped>
.host-create-lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
  position: relative;
}

.title {
  font-size: 4rem;
  color: #222020;
  margin: 0;
  font-weight: bold;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
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

.name-input:focus {
  outline: none;
  border-color: #4CAF50;
  transform: scale(1.02);
}

.actions {
  display: flex;
  gap: 6rem;
}

.btn {
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
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.btn:active {
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

@media (max-width: 600px) {
  .name-input { width: 250px; }
  .btn { padding: 0.8rem 2rem; font-size: 1.2rem }
  .title { font-size: 3rem; }
  .actions { gap: 3rem; }
}
</style>
