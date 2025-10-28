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
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    players = players.filter((p) => p.id !== socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port:3000"));
