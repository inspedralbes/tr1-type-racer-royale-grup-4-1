<template>
  <template v-if="!startGame">
    <FirstPage v-if="!showMainMenu && !showLobby && !showRoomsUserView && !showHostCreateLobby && !showUserLobby" @lobby="showLobby = true" />
    <Lobby v-else-if="showLobby" @back="showLobby = false" @joinRoom="handleJoinRoom" @createRoom="handleCreateRoom" />
    <HostCreateLobby v-else-if="showHostCreateLobby" @backToLobby="handleBackFromCreateLobby" @roomCreated="handleRoomCreated" />
    <RoomsUserView v-else-if="showRoomsUserView" @back="handleBackFromRooms" @joinedRoom="handleJoinedRoom" />
    <UserLobby v-else-if="showUserLobby" @back="handleBackFromUserLobby" @startGame="handleGameStart" />
    <MainMenu v-else-if="showMainMenu" />
  </template>
  <template v-else>
    <GameEngine @activeKey="handleActiveKey" @back="handleBackFromGame" />
    <Keyboard :activeKey="currActiveKey" />
  </template>
</template>

<script setup>
import { ref, nextTick } from "vue";
import GameEngine from "./components/GameEngine.vue";
import MainMenu from "./components/MainMenu.vue";
import Keyboard from "./components/Keyboard.vue";
import { useGameStore } from "@/stores/gameStore.js";
import FirstPage from "./components/FirstPage.vue";
import Lobby from "./components/Lobby.vue";
import Config from "./components/Config.vue"; 
import RoomsUserView from "./components/RoomsUserView.vue";
import HostCreateLobby from "./components/HostCreateLobby.vue";
import UserLobby from "./components/UserLobby.vue";
  
const startGame = ref(false);
const showMainMenu = ref(false);
const showLobby = ref(false);
const showConfig = ref(false);
const showHostCreateLobby = ref(false); 
const showUserLobby = ref(false);
const currActiveKey = ref("");
const store = useGameStore();
const manager = store.manager;
const showRoomsUserView = ref(false);
manager.on("gameStart", handleGameStart);
function handleJoinRoom() {
  showLobby.value = false;
  showRoomsUserView.value = true;
  // Forzar una actualización de las salas al navegar
  nextTick(() => {
    if (store.manager.socket) {
      console.log('Solicitando salas al navegar...');
      store.manager.emit('getRooms');
    }
  });
}

function handleCreateRoom() {
  showLobby.value = false;
  showHostCreateLobby.value = true;
}

function handleBackFromCreateLobby() {
  showHostCreateLobby.value = false;
  showLobby.value = true;
}

function handleRoomCreated(roomName) {
  showHostCreateLobby.value = false;
  showUserLobby.value = true;
  // Guardar el nombre de la sala en el store
  store.setRoomName(roomName);
  console.log('Sala creada y unido a:', roomName);
}

function handleBackFromRooms() {
  showRoomsUserView.value = false;
  showLobby.value = true;
}

function handleJoinedRoom() {
  showRoomsUserView.value = false;
  showUserLobby.value = true;
}

function handleBackFromUserLobby() {
  showUserLobby.value = false;
  showRoomsUserView.value = true;
}

function handleGameStart() {
  console.log('Iniciando juego en App.vue');
  // Ocultar todas las pantallas
  showUserLobby.value = false;
  showRoomsUserView.value = false;
  showLobby.value = false;
  showHostCreateLobby.value = false;
  showMainMenu.value = false;
  // Mostrar el juego
  startGame.value = true;
}

function handleBackFromGame() {
  startGame.value = false;
  // Mostrar FirstPage
  showLobby.value = false;
  showRoomsUserView.value = false;
  showHostCreateLobby.value = false;
  showUserLobby.value = false;
  showMainMenu.value = false;
}

function handleActiveKey(key) {
  currActiveKey.value = "";
  requestAnimationFrame(() => {
    currActiveKey.value = key;
  });
}
</script>

<style>
body {
  background-color: #e6e6e6;
  font-family: sans-serif;
  margin: 0;
  padding: 0;
}

/* Estilos compartidos entre pantallas */
.title {
  font-size: 4rem;
  color: #222020;
  margin: 0;
  font-weight: bold;
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
</style>