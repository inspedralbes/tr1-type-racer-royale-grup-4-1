<template>
  <main v-if="!savedUsername" class="container">
    <h1 class="title">Word Tetris</h1>
    <input class="name-input" v-model="username" placeholder="Introduce tu nombre" />
    <button class="btn" @click="updateUsername">Add username!</button>
  </main>
  <main v-else-if="joinedRoom" class="container">
    <h1 class="title">You have entered the room! Name: {{ roomName }}</h1>
    <button class="btn-start" :disabled="!isRoomFull" @click="toggleReady">
      {{ ready ? "Ready!" : "Not ready" }}
    </button>
  </main>
  <main v-else class="container">
    <h1 class="title">Join a room!</h1>
    <input class="name-input" v-model="roomName" placeholder="Nombre de sala" />
    <button class="btn" @click="joinRoomViaName">Join room!</button>
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
.container {
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-top: 20vh;
}

.player-list {
  list-style-type: none;
  border: 1px solid #d0d0d0;
  width: 300px;
  height: auto;
  padding: 0.5rem;
}
</style>
