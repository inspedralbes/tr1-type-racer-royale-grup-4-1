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
console.log(articles);
// Socket.io logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  //Creates a new player
  players.push({ id: socket.id, username: null });
  socket.on("saveUsername", (username) => {
    //Find the player
    let player = players.find((p) => p.id === socket.id);
    player.username = username;
    io.emit("updatePlayerData", players);
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
    room.players.push(player);
    io.emit("updateRooms", rooms);
  });

  socket.on("gameStart", () => {
    io.emit("gameStart");
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

  socket.on("getRooms", () => {
    console.log(`[${socket.id}] Solicitando lista de salas (${rooms.length} salas disponibles)`);
    // Enviar la lista de salas al cliente que la solicitó
    socket.emit("roomData", rooms);
    // También actualizar a todos los clientes conectados
    io.emit("updateRooms", rooms);
  });

  // Manejar errores
  socket.on("error", (error) => {
    console.error(`[${socket.id}] Error de socket:`, error);
  });


  // Manejar cuando un jugador abandona una sala
  socket.on("leaveRoom", (roomName) => {
    console.log(`Jugador ${socket.id} está abandonando la sala: ${roomName}`);
    
    // Encontrar la sala
    const room = rooms.find(r => r.name === roomName);
    if (room) {
      // Eliminar al jugador de la sala
      room.players = room.players.filter(p => p.id !== socket.id);
      console.log(`Jugador ${socket.id} eliminado de la sala ${roomName}`);
      
      // Si la sala está vacía, eliminarla
      if (room.players.length === 0) {
        rooms = rooms.filter(r => r.name !== roomName);
        console.log(`Sala ${roomName} eliminada por estar vacía`);
      }
      
      // Notificar a todos los clientes la actualización
      io.emit("updateRooms", rooms);
      
      // Notificar a los jugadores restantes en la sala
      socket.leave(roomName);
      io.to(roomName).emit('playerLeft', { playerId: socket.id, roomName });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Encontrar todas las salas donde estaba el jugador
    const playerRooms = rooms.filter(room => 
      room.players.some(p => p.id === socket.id)
    );
    
    // Eliminar al jugador de todas las salas
    rooms.forEach(room => {
      room.players = room.players.filter(p => p.id !== socket.id);
      
      // Si la sala queda vacía, eliminarla
      if (room.players.length === 0) {
        rooms = rooms.filter(r => r.name !== room.name);
        console.log(`Sala ${room.name} eliminada por estar vacía`);
      }
    });
    
    // Eliminar al jugador de la lista global
    players = players.filter((p) => p.id !== socket.id);
    
    // Notificar a todos los clientes la actualización
    if (playerRooms.length > 0) {
      io.emit("updateRooms", rooms);
      
      // Notificar a las salas afectadas
      playerRooms.forEach(room => {
        io.to(room.name).emit('playerLeft', { playerId: socket.id, roomName: room.name });
      });
    }
  });
});

server.listen(3000, () => console.log("Server running on port:3000"));
