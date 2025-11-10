import SocketManager from "../../services/socketManager";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useGameStore = defineStore("rooms", () => {
  const currentRoom = ref("");
  const username = ref(localStorage.getItem('username') || "");
  const userId = ref(localStorage.getItem('userId') || null);
  const money = ref(parseInt(localStorage.getItem('money')) || 0);
  const manager = new SocketManager();
  manager.connect();
  const roomFull = ref(false);
  const rooms = ref([]);
  const roomScore = ref([]);
  
  // Control de audio global
  const backgroundMusic = ref(null);
  const musicVolume = ref(parseInt(localStorage.getItem('musicVolume')) || 30);

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
    localStorage.setItem('username', name);
    console.log('✅ Username guardado en Pinia y localStorage:', name);
  }

  function setUserId(id) {
    userId.value = id;
    localStorage.setItem('userId', id);
    console.log('✅ UserId guardado en Pinia y localStorage:', id);
  }

  function setMoney(amount) {
    money.value = amount;
    localStorage.setItem('money', amount);
    console.log('✅ Money guardado en Pinia y localStorage:', amount);
  }

  async function fetchUserMoney() {
    if (!userId.value) return;
    try {
      const response = await fetch(`http://localhost:3000/api/get-user-money/${userId.value}`);
      const data = await response.json();
      if (data.ok) {
        setMoney(data.money);
      }
    } catch (error) {
      console.error('Error fetching user money:', error);
    }
  }

  async function updateMoney(amount) {
    if (!userId.value) return;
    try {
      const response = await fetch('http://localhost:3000/api/update-user-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId.value, amount }),
      });
      const data = await response.json();
      if (data.ok) {
        setMoney(data.money);
      }
    } catch (error) {
      console.error('Error updating user money:', error);
    }
  }

  function setRoomName(roomName) {
    currentRoom.value = roomName;
  }

  function setRooms(newRooms) {
    rooms.value = newRooms;
    console.log("Rooms actualizadas en store:", newRooms);
  }

  function setBackgroundMusic(musicControl) {
    backgroundMusic.value = musicControl;
  }

  function setMusicVolume(volume) {
    musicVolume.value = volume;
    localStorage.setItem('musicVolume', volume);
    if (backgroundMusic.value) {
      backgroundMusic.value.setVolume(volume / 100);
    }
  }

  const isRoomFull = computed(() => roomFull.value);

  return {
    currentRoom,
    username,
    userId,
    money,
    rooms,
    setUsername,
    setUserId,
    setMoney,
    fetchUserMoney,
    updateMoney,
    setRoomName,
    setRooms,
    isRoomFull,
    manager,
    roomFull,
    roomScore,
    backgroundMusic,
    musicVolume,
    setBackgroundMusic,
    setMusicVolume,
  };
});
