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
  const roomScore = ref([]);

  // Configurar listeners para eventos de socket
  const setupSocketListeners = () => {
    console.log("🔌 Configurando listeners de socket...");

    const handleConnect = () => {
      console.log("✅ Socket conectado desde el store");
      // Esperar un momento antes de solicitar las salas
      setTimeout(() => {
        console.log("🔄 Solicitando salas al conectar...");
        manager.emit("getRooms");
      }, 100);
    };

    const handleRoomData = (data) => {
      console.log("📥 Datos de sala recibidos en store:", data);
      if (Array.isArray(data)) {
        setRooms(data);
      } else {
        console.warn("Datos de sala no válidos recibidos:", data);
      }
    };

    const handleUpdateRooms = (data) => {
      console.log("🔄 Actualización de salas recibida:", data);
      if (Array.isArray(data)) {
        setRooms(data);
      }
    };

    const handleScoresInRoom = (data) => {
      console.log("Got the scores update!", data);
      roomScore.value = data;
    };

    // Configurar listeners
    manager.on("connect", handleConnect);
    manager.on("roomFull", (data) => (roomFull.value = data));
    manager.on("roomData", handleRoomData);
    manager.on("updateRooms", handleUpdateRooms);
    manager.on("leaderboardUpdateInRoom", handleScoresInRoom);
    // Manejar cuando un jugador abandona la sala
    manager.on("playerLeft", ({ playerId, roomName }) => {
      console.log(`Jugador ${playerId} ha abandonado la sala ${roomName}`);
      // Si el jugador que salió es el usuario actual, limpiar la sala actual
      if (playerId === manager.socket?.id) {
        console.log("Has abandonado la sala:", roomName);
        currentRoom.value = "";
      }
      // Forzar actualización de salas
      manager.emit("getRooms");
    });

    // Si ya estamos conectados, forzar una actualización
    if (manager.socket?.connected) {
      handleConnect();
    }
  };

  // Configurar los listeners cuando se crea el store
  setupSocketListeners();

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
    console.log("Rooms actualizadas en store:", newRooms);
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
    roomScore,
  };
});
