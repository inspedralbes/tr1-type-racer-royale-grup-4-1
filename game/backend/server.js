const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Serve Vue frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

let players = [];
let rooms = [];

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
    room.players.push(player);
    io.emit("updateRooms", rooms);
  });

  socket.on("gameStart", () => {
    io.emit("gameStart");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    players = players.filter((p) => p.id !== socket.id);
    rooms.forEach((room) => {
      room.players = room.players.filter((p) => p.id !== socket.id);
    });
    io.emit("updateRooms", rooms);
  });
});

server.listen(3000, () => console.log("Server running on port:3000"));
