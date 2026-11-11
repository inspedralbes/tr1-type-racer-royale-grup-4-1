<template>
  <AlertContainer />
  <MoneyContainer v-if="store.userId && !startGame && !isFirstPageVisible" />
  <template v-if="showPodio">
    <Podio :podiumData="podiumData" @back="handleBackFromPodio" />
  </template>
  <template v-else-if="startGame">
    <GameEngine @back="handleBackFromGame" @showPodium="handleShowPodium" />
  </template>
  <template v-else>
    <FirstPage v-if="!showLobby && !showRoomsUserView && !showHostCreateLobby && !showUserLobby" @lobby="showLobby = true" />
    <Lobby v-else-if="showLobby" @back="showLobby = false" @joinRoom="handleJoinRoom" @createRoom="handleCreateRoom" />
    <HostCreateLobby v-else-if="showHostCreateLobby" @backToLobby="handleBackFromCreateLobby" @roomCreated="handleRoomCreated" />
    <RoomsUserView v-else-if="showRoomsUserView" @back="handleBackFromRooms" @joinedRoom="handleJoinedRoom" />
    <UserLobby v-else-if="showUserLobby" @back="handleBackFromUserLobby" @startGame="handleGameStart" />
  </template>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from "vue";
import GameEngine from "./components/GameEngine.vue";
import { useGameStore } from "@/stores/gameStore.js";
import FirstPage from "./components/FirstPage.vue";
import Lobby from "./components/Lobby.vue";
import RoomsUserView from "./components/RoomsUserView.vue";
import HostCreateLobby from "./components/HostCreateLobby.vue";
import UserLobby from "./components/UserLobby.vue";
import MoneyContainer from "./components/MoneyContainer.vue";
import Podio from "./components/Podio.vue";
import AlertContainer from "./components/AlertContainer.vue";
import { useBackgroundMusicAutoplay } from "@/composables/useBackgroundMusicAutoplay.js";
import { useSoundEffect } from "@/composables/useSoundEffect.js";
  
const startGame = ref(false);
const showLobby = ref(false);
const showHostCreateLobby = ref(false); 
const showUserLobby = ref(false);
const showPodio = ref(false);
const podiumData = ref(null);
const store = useGameStore();
const isFirstPageVisible = computed(
  () =>
    !startGame.value &&
    !showLobby.value &&
    !showRoomsUserView.value &&
    !showHostCreateLobby.value &&
    !showUserLobby.value
);
const showRoomsUserView = ref(false);
store.manager.on("gameStart", handleGameStart);

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
  store.manager.on('showPodium', (data) => {
    console.log('🏆 App.vue: Evento showPodium recibido:', data);
    console.log('🏆 Estado actual - startGame:', startGame.value, 'showPodio:', showPodio.value);
    
    // En modo muerte súbita, solo mostrar podio al ganador
    if (data.gameMode === 'muerte-subita') {
      const currentUser = store.username;
      const isWinner = data.winner === currentUser;
      
      console.log('💀 Modo muerte súbita - Usuario:', currentUser, 'Ganador:', data.winner, 'Es ganador:', isWinner);
      
      if (!isWinner) {
        console.log('🚫 Jugador no es el ganador en modo muerte súbita - mantener pantalla de eliminación');
        // No ocultar el juego inmediatamente para permitir que se muestre la pantalla de eliminación
        // El GameEngine ya debería tener isEliminated = true y mostrar EliminatedScreen
        // La redirección al lobby se manejará desde EliminatedScreen cuando el usuario haga clic en "VOLVER AL LOBBY"
        return;
      }
    }
    
    console.log('🏆 Cambiando a podio...');
    podiumData.value = data;
    startGame.value = false;
    showPodio.value = true;
    console.log('🏆 Estado después del cambio - startGame:', startGame.value, 'showPodio:', showPodio.value);
    
    // Update user money after game ends
    if (store.userId) {
      fetch(`/api/get-user-money/${store.userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            store.setMoney(data.money);
          }
        })
        .catch(err => console.error('Error fetching updated money:', err));
    }
  });
  
  // Debug: Check if the event is being registered
  console.log('🔧 App.vue: Listener showPodium registrado');
  
  // Debug: Add a timeout to check if the event arrives later
  setTimeout(() => {
    console.log('🔧 App.vue: Estado después de 2 segundos - startGame:', startGame.value, 'showPodio:', showPodio.value);
  }, 2000);
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
  // Mostrar el juego
  startGame.value = true;
}

function handleBackFromGame() {
  startGame.value = false;
  // Mostrar Lobby (usuario ya está logueado)
  showLobby.value = true;
  showRoomsUserView.value = false;
  showHostCreateLobby.value = false;
  showUserLobby.value = false;
  showMainMenu.value = false;
}

function handleShowPodium(data) {
  console.log('🏆 App.vue: handleShowPodium llamado desde GameEngine:', data);
  console.log('🏆 Estado actual - startGame:', startGame.value, 'showPodio:', showPodio.value);
  
  // En modo muerte súbita, solo mostrar podio al ganador
  if (data.gameMode === 'muerte-subita') {
    const currentUser = store.username;
    const isWinner = data.winner === currentUser;
    
    console.log('💀 Modo muerte súbita - Usuario:', currentUser, 'Ganador:', data.winner, 'Es ganador:', isWinner);
    
    if (!isWinner) {
      console.log('🚫 Jugador no es el ganador en modo muerte súbita - mantener pantalla de eliminación');
      return;
    }
  }
  
  console.log('🏆 Cambiando a podio desde GameEngine...');
  podiumData.value = data;
  startGame.value = false;
  showPodio.value = true;
  console.log('🏆 Estado después del cambio - startGame:', startGame.value, 'showPodio:', showPodio.value);
  
  // Update user money after game ends
  if (store.userId) {
    fetch(`/api/get-user-money/${store.userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          store.setMoney(data.money);
        }
      })
      .catch(err => console.error('Error fetching updated money:', err));
  }
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
  // Return to lobby (usuario ya está logueado)
  showLobby.value = true;
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