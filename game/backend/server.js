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
    console.log("User disconnected:", socket.id);
    players = players.filter((p) => p.id !== socket.id);
    rooms.forEach((room) => {
      room.players = room.players.filter((p) => p.id !== socket.id);
    });
    io.emit("updateRooms", rooms);
  });
});

server.listen(3000, () => console.log("Server running on port:3000"));
