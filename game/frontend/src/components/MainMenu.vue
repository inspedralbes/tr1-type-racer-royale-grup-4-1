<template>
  <main v-if="!savedUsername" class="container">
    <h1 class="title">Word Tetris</h1>
    <input class="username" v-model="username" />
    <button class="btn-start" @click="updateUsername">Add username!</button>
  </main>
  <main v-else-if="joinedRoom" class="container">
    <h1 class="title">You have entered the room! Name: {{ roomName }}</h1>
    <button class="btn-start" :disabled="!isRoomFull" @click="toggleReady">
      {{ ready ? "Ready!" : "Not ready" }}
    </button>
  </main>
  <main v-else class="container">
    <h1 class="title">Join a room!</h1>
    <input class="username" v-model="roomName" />
    <button class="btn-start" @click="joinRoomViaName">Join room!</button>
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
  manager.emit("joinRoom", roomName.value);
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
}
.title {
  color: white;
  font-size: 4em;
  font-family: sans-serif;
  margin-top: 30vh;
}

.btn-start {
  color: black;
  background-color: #e2b714;
  padding: 20px 40px;
  font-size: 2em;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.title-smaller {
  color: white;
  font-size: 3em;
  font-family: sans-serif;
  margin-top: 20vh;
}
.player-list {
  color: white;
  font-size: 2em;
  list-style-type: none;
  border: 1px solid yellow;
  width: 300px;
  height: auto;
}

.title-small-2 {
  color: white;
  font-size: 2em;
  font-family: sans-serif;
}

.username {
  font-size: 2.5em;
  color: white;
  padding: 10px 20px;
  z-index: 1;
  border: 1px solid yellow;
  border-radius: 10px;
  width: 225px;
  background-color: #323437;
  margin-bottom: 30px;
}
</style>
