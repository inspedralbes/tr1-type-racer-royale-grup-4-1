import SocketManager from "../../services/socketManager";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useGameStore = defineStore("rooms", () => {
  const currentRoom = ref("");
  const username = ref("");
  const manager = new SocketManager();
  manager.connect();
  const roomFull = ref(false);

  manager.on("isRoomFull", (data) => {
    roomFull.value = data;
  });

  function setUsername(name) {
    username.value = name;
  }

  function setRoomName(roomName) {
    currentRoom.value = roomName;
  }

  const isRoomFull = computed(() => roomFull.value);

  return {
    currentRoom,
    username,
    setUsername,
    setRoomName,
    isRoomFull,
    manager,
  };
});
