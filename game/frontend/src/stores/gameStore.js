import { defineStore } from "pinia";
import { ref } from "vue";

export const useGameStore = defineStore("rooms", () => {
  const currentRoom = ref("");
  const username = ref("");

  function setUsername(name) {
    username.value = name;
  }

  function setRoomName(roomName) {
    currentRoom.value = roomName;
  }

  return {
    currentRoom,
    username,
    setUsername,
    setRoomName,
  };
});
