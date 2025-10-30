const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const articles = require("./data/data.json");
// Serve Vue frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

let players = [];
let rooms = [];
let leaderboard = [];

// Configurable room capacity
const ROOM_CAPACITY = 4;

// Helper to translate internal status codes to human-friendly strings
function translateState(status) {
  switch(status) {
    case "ready": return "Listo";
    case "finished": return "Finalizado";
    case "playing": return "Jugando";
    default: return "Esperando";
  }
}

// Socket.io logic
io.on("connection", (socket) => {
  const newPlayer = {
    id: socket.id,
    username: null,
    status: "waiting",
    room: null,
  };
  players.push(newPlayer);
  console.log(
    `\n👤 User connected: ${socket.id} (${newPlayer.username || "no-name"}) - ${translateState(newPlayer.status)}`,
  );
  socket.on("saveUsername", (username) => {
    //Find the player
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;
    player.username = username;
    player.status = "not-joined"; // Estado inicial al guardar nombre
    console.log(`\n📝 Player ${socket.id} saved name: ${username}`);
    console.log(`Status: ${translateState(player.status)}`);
    // Also print the standard "User connected" line but with the username so it's visible in logs
    console.log(
      `👤 User connected: ${socket.id} (${username}) - ${translateState(player.status)}`,
    );

    io.emit("updatePlayerData", players);
    let existingRoom = rooms.find((r) => r.name === "testRoom");
    if (!existingRoom) {
      rooms.push({ name: "testRoom", players: [] });
    } //Broadcast for now the room id
    io.emit("roomData", rooms);
  });
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    let room = rooms.find((r) => r.name === roomName);
    if (!room) {
      console.log("Room not found:", roomName);
      return;
    }
    let player = players.find((p) => p.id === socket.id);
    if (!player) {
      console.log("Player not found:", socket.id);
      return;
    }
    if (!room.players.find((p) => p.id === socket.id)) {
      player.room = roomName;
      player.status = "waiting";
      room.players.push(player);

      // Comprueba si la sala está llena (ROOM_CAPACITY jugadores)
      console.log(
        `\n🎮 Player ${player.username || socket.id} joined room: ${roomName}`,
      );
      console.log(`Status: ${translateState(player.status)}`);
      console.log(`Room players: ${room.players.length}/${ROOM_CAPACITY}`);

      if (room.players.length === ROOM_CAPACITY) {
        // Marca la sala como llena y solicita a los jugadores que confirmen 'ready'
        room.isFull = true;
        console.log(
          "\n🎯 Room is full! Waiting for all players to press ready...",
        );
        // Emite al frontend que la sala está llena y los clientes deben mostrar el botón 'Ready'
        io.to(roomName).emit("roomFull", true);
        io.to(roomName).emit("requestReady");
      }
    }

    io.to(roomName).emit("updateRooms", rooms);
    io.to(roomName).emit("updateRoomPlayers", room.players);

    logGameState(room);
  });

  function checkStartGame(room) {
    const allReady = room.players.every((p) => p.status === "ready");

    if (allReady && room.players.length > 1) {
      io.to(room.name).emit("gameStart");
      console.log("Game started in room:", room.name);
      room.players.forEach((p) => {
        p.status = "playing";
      });
      io.to(room.name).emit("gameStarted", room.players);
    }
  }

  socket.on("gameStart", () => {
    io.emit("gameStart");
  });

  // Handler para cuando un jugador pulsa el botón 'Ready' en el frontend
  socket.on("playerReady", (isReady) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;
    player.status = isReady ? "ready" : "waiting";
    const room = rooms.find((r) => r.name === player.room);
    if (room) {
      io.to(room.name).emit("updateRoomPlayers", room.players);
      console.log(
        `\n✅ Player ${player.username || player.id} set ready=${isReady} in room ${room.name}`,
      );
      logGameState(room);
      // Comprueba si todos los jugadores están listos para arrancar
      checkStartGame(room);
    }
  });

  socket.on("isRoomFull", (roomName) => {
    let roomFull = false;
    let room = rooms.find((r) => r.name === roomName);
    if (!room) {
      console.log("room doesn't exist");
    } else if (room.players.length > 3) {
      roomFull = true;
    } else {
      roomFull = false;
    }
    socket.emit("roomFull", roomFull);
  });

  /*
  socket.on("isRoomFull", (roomName) => {
    let room = rooms.find((r) => r.name === roomName);
    if (!room) return socket.emit("roomFull", false);

    let roomFull = room.players.length >= 4; // Example limit
    socket.emit("roomFull", roomFull);
  });
  */

  //TODO: Add so that the server receives the emit of ready status
  //socket.on("playerStatus", (status) => {
  //  let playerInRoom = rooms.players.find((p) => p.id === socket.id);
  //  playerInRoom.ready = status;
  //});
  //

  socket.on("createRoom", (roomName) => {
    let roomExists = rooms.find((r) => r.name === roomName);
    if (!roomExists) {
      rooms.push({ name: roomName, players: [] });
      io.emit("updateRooms", rooms);
    } else {
      console.log("Room already exists!");
    }
  });

  socket.on("getArticles", () => {
    socket.emit("articlesData", articles);
  });

  socket.on("userResults", (userResults) => {
    if (!userResults) return;
    leaderboard.push({
      name: userResults.name,
      time: userResults.time,
      errors: userResults.errors,
    });
    socket.emit("updateLeaderboard", leaderboard);
  });

  socket.on("disconnect", () => {
    const player = players.find((p) => p.id === socket.id);
    console.log(
      `User disconnected: ${socket.id} (${player ? player.username || "no-name" : "unknown"})`,
    );

    players = players.filter((p) => p.id !== socket.id);
    // Remove the player from every room and emit updates per room
    rooms.forEach((room) => {
      const before = room.players.length;
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length !== before) {
        io.to(room.name).emit("updateRoom", room);
        io.to(room.name).emit("gameStateUpdate", room.players);
        logGameState(room);
      }
    });
    // Emit overall rooms list to everyone
    io.emit("updateRooms", rooms);
  });
  function logGameState(room) {
    console.log(`\n--- GAME STATE | ROOM: ${room.name} ---`);
    room.players.forEach((p) => {
      console.log(`${p.username || p.id}: ${translateState(p.status)}`);
    });
    console.log("-------------------------------------\n");
  }

  // translateState moved to top-level so it's available before io.on
});

server.listen(3000, () => console.log("Server running on port:3000"));
