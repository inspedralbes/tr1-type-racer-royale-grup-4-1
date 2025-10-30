import SocketManager from "../../services/socketManager";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useGameStore = defineStore("rooms", () => {
  const currentRoom = ref("");
  const username = ref("");
  const manager = new SocketManager();
  manager.connect();
  const roomFull = ref(false);
  const rooms = ref([]);

  //Ensure that the listener is there
  manager.socket.on("connect", () => {
    console.log("Socket connected from store");

    manager.on("roomFull", (data) => {
      roomFull.value = data;
    });
  });

  function handleRoomFull(data) {
    roomFull.value = data;
  }

  function setUsername(name) {
    username.value = name;
  }

  function setRoomName(roomName) {
    currentRoom.value = roomName;
  }

  function setRooms(newRooms) {
    rooms.value = newRooms;
    console.log('Rooms actualizadas en store:', newRooms);
  }

  const isRoomFull = computed(() => roomFull.value);

  return {
    currentRoom,
    username,
    rooms,
    setUsername,
    setRoomName,
    setRooms,
    isRoomFull,
    manager,
    roomFull,
  };
});
