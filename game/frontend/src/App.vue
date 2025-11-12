<template>
  <MoneyContainer v-if="store.userId" />
  <template v-if="showPodio">
    <Podio :podiumData="podiumData" @back="handleBackFromPodio" />
  </template>
  <template v-else-if="startGame">
    <GameEngine @activeKey="handleActiveKey" @back="handleBackFromGame" />
    <Keyboard :activeKey="currActiveKey" />
  </template>
  <template v-else>
    <FirstPage v-if="!showMainMenu && !showLobby && !showRoomsUserView && !showHostCreateLobby && !showUserLobby" @lobby="showLobby = true" />
    <Lobby v-else-if="showLobby" @back="showLobby = false" @joinRoom="handleJoinRoom" @createRoom="handleCreateRoom" />
    <HostCreateLobby v-else-if="showHostCreateLobby" @backToLobby="handleBackFromCreateLobby" @roomCreated="handleRoomCreated" />
    <RoomsUserView v-else-if="showRoomsUserView" @back="handleBackFromRooms" @joinedRoom="handleJoinedRoom" />
    <UserLobby v-else-if="showUserLobby" @back="handleBackFromUserLobby" @startGame="handleGameStart" />
    <MainMenu v-else-if="showMainMenu" />
  </template>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from "vue";
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
import MoneyContainer from "./components/MoneyContainer.vue";
import Podio from "./components/Podio.vue";
import { useBackgroundMusicAutoplay } from "@/composables/useBackgroundMusicAutoplay.js";
import { useSoundEffect } from "@/composables/useSoundEffect.js";
  
const startGame = ref(false);
const showMainMenu = ref(false);
const showLobby = ref(false);
const showConfig = ref(false);
const showHostCreateLobby = ref(false); 
const showUserLobby = ref(false);
const showPodio = ref(false);
const podiumData = ref(null);
const currActiveKey = ref("");
const store = useGameStore();
const manager = store.manager;
const isFirstPageVisible = computed(
  () =>
    !startGame.value &&
    !showMainMenu.value &&
    !showLobby.value &&
    !showRoomsUserView.value &&
    !showHostCreateLobby.value &&
    !showUserLobby.value
);
const showRoomsUserView = ref(false);
manager.on("gameStart", handleGameStart);

// Inicializar música de fondo con autoplay agresivo
const musicControl = useBackgroundMusicAutoplay('/music/mainTheme.wav', {
  volume: store.musicVolume / 100,
  loop: true,
  autoplay: true
});

// Inicializar sonido de clic de botones
const clickSoundControl = useSoundEffect('/music/clickButton.mp3', {
  volume: 0.5
});

onMounted(() => {
  musicControl.init();
  clickSoundControl.init();
  // Registrar controles de audio en el store para acceso global
  store.setBackgroundMusic(musicControl);
  store.setClickSound(clickSoundControl);
  
  // Listen for podium navigation event from server
  manager.on('showPodium', (data) => {
    console.log('Navigating to podium with data:', data);
    podiumData.value = data;
    startGame.value = false;
    showPodio.value = true;
    
    // Update user money after game ends
    if (store.userId) {
      fetch(`http://localhost:3000/api/get-user-money/${store.userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            store.setMoney(data.money);
          }
        })
        .catch(err => console.error('Error fetching updated money:', err));
    }
  });
});

onUnmounted(() => {
  musicControl.cleanup();
});
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

function handleBackFromPodio() {
  showPodio.value = false;
  podiumData.value = {
    rankings: [],
    totalPot: 0,
    winner: ''
  };
  // Leave the room
  if (store.currentRoom) {
    store.manager.emit('leaveRoom', store.currentRoom);
    store.setRoomName('');
  }
  // Return to first page
  showLobby.value = false;
  showRoomsUserView.value = false;
  showHostCreateLobby.value = false;
  showUserLobby.value = false;
  showMainMenu.value = false;
}
</script>

<style>
body {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  background: var(--bg-body);
  color: var(--text-primary);
}
</style>