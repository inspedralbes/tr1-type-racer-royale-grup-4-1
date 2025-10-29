<template>
  <main v-if="!savedUsername" class="container">
    <h1 class="title">Word Tetris</h1>
    <input class="name-input" v-model="username" placeholder="Introduce tu nombre" />
    <button class="btn" @click="updateUsername">Add username!</button>
  </main>
  <main v-else-if="joinedRoom" class="container">
    <h1 class="title">You have entered the room! Name: {{ roomName }}</h1>
    <button class="btn" :disabled="!isRoomFull" @click="gameStart">
      Start playing
    </button>
  </main>
  <main v-else class="container">
    <h1 class="title">Join a room!</h1>
    <input class="name-input" v-model="roomName" placeholder="Nombre de sala" />
    <button class="btn" @click="joinRoomViaName">Join room!</button>
  </main>
</template>
<script setup>
import { ref, inject, computed } from "vue";

const username = ref("");
const savedUsername = ref("");
const players = ref([]);
const rooms = ref([]);
const roomName = ref("");
const joinedRoom = ref(false);
const manager = inject("socketManager");

//Gets the room users
const isRoomFull = computed(() => {
  const room = rooms.value.find((r) => r.name === roomName.value);
  let roomLenght = room.players.length;
  let roomFull = false;
  if (roomLenght > 3) {
    roomFull = true;
  }
  return roomFull;
});

//Saves username and emits to server
function updateUsername() {
  if (username.value.trim() !== "") {
    savedUsername.value = username.value.trim();
    manager.emit("saveUsername", savedUsername.value);
  } else {
    alert("Please enter a valid username!");
  }
}

function gameStart() {
  manager.emit("gameStart");
}

function handlePlayers(data) {
  players.value = data;
}

function handleRoomData(data) {
  rooms.value = [...data];
}

function joinRoomViaName() {
  manager.emit("joinRoom", roomName.value);
}

function handleRoomsData(data) {
  rooms.value = [...data];
  joinedRoom.value = true;
  console.log(rooms.value);
}

manager.on("updatePlayerData", handlePlayers);
manager.on("roomData", handleRoomData);
manager.on("updateRoom", handleRoomData);
manager.on("updateRooms", handleRoomsData);
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
