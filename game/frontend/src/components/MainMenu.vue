<template>
  <main v-if="!savedUsername" class="menu-wrapper">
    <section class="card-paper menu-card">
      <h1 class="menu-title">Word Tetris</h1>
      <input class="input-field" v-model="username" placeholder="Introdueix el teu nom" />
      <button class="btn btn-primary" @click="updateUsername">Guardar nom</button>
    </section>
  </main>
  <main v-else-if="joinedRoom" class="menu-wrapper">
    <section class="card-paper menu-card">
      <h1 class="menu-title">Has entrat a la sala {{ roomName }}</h1>
      <button class="btn btn-primary" :disabled="!isRoomFull" @click="toggleReady">
        {{ ready ? "Preparat!" : "Encara no" }}
      </button>
    </section>
  </main>
  <main v-else class="menu-wrapper">
    <section class="card-paper menu-card">
      <h1 class="menu-title">Uneix-te a una sala</h1>
      <input class="input-field" v-model="roomName" placeholder="Nom de la sala" />
      <button class="btn btn-primary" @click="joinRoomViaName">Entrar a la sala</button>
    </section>
  </main>
</template>
<script setup>
import { ref, onMounted } from "vue";
//Pinia for being able to retrieve username and roomNames after
import { useGameStore } from "@/stores/gameStore";

const username = ref("");
const savedUsername = ref("");
const players = ref([]);
const emit = defineEmits(["gameStart"]);
const ready = ref(false);
const store = useGameStore();
const rooms = ref([]);
const roomName = ref("");
const joinedRoom = ref(false);
const manager = store.manager;
const isRoomFull = store.isRoomFull;

//Waits till we get the manager
onMounted(() => {
  if (manager) {
    manager.on("roomData", handleRoomData);
    manager.on("updateRoom", handleRoomData);
    manager.on("updateRooms", handleRoomsData);
    manager.on("updatePlayerData", handlePlayers);
  } else {
    console.error("Socket manager not ready yet");
  }
});

function toggleReady() {
  ready.value = !ready.value;
  manager.emit("playerStatus", ready.value);
}

//Saves username and emits to server
function updateUsername() {
  if (username.value.trim() !== "") {
    savedUsername.value = username.value.trim();
    store.setUsername(savedUsername.value);
    manager.emit("saveUsername", savedUsername.value);
  } else {
    alert("Please enter a valid username!");
  }
}

function handlePlayers(data) {
  players.value = data;
}

function handleRoomData(data) {
  rooms.value = [...data];
}

function joinRoomViaName() {
  manager.emit("joinRoom", {
    roomName: roomName.value,
    userId: store.userId,
    username: store.username
  });
  store.setRoomName(roomName.value);
}

function handleRoomsData(data) {
  rooms.value = [...data];
  joinedRoom.value = true;
  manager.emit("isRoomFull", roomName.value);
}
</script>
<style scoped>
.menu-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: color-mix(in srgb, var(--color-secondary) 25%, var(--bg-body) 75%);
  padding: var(--spacing-2xl) var(--spacing-xl);
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: min(420px, 92vw);
  text-align: center;
}

.menu-title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.08rem;
}

.menu-card .btn {
  align-self: center;
  min-width: 200px;
}
</style>
