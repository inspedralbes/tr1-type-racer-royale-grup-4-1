const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const sql = require("mysql2"); //To be able to connect to the database
const bcrypt = require("bcrypt"); //Hash tool for passwords
console.log(process.env.DB_USER);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const articles = require("./data/data.json");
//Serve Vue frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

//Inject the enviroment variables
let players = [];
let rooms = [];
let leaderboard = [];

// Configurable room capacity
const ROOM_CAPACITY = 4;

// Socket.io logic
io.on("connection", (socket) => {
  const newPlayer = {
    id: socket.id,
    username: null,
    status: "waiting",
    room: null,
  };
  //Push the player to the array
  players.push(newPlayer);
  socket.on("register", (userData) => {
    registerUser(userData.username, userData.password, (ok, payload) => {
      if (ok) {
        socket.emit("registerResult", { ok: true, userId: payload.userId });
      } else {
        socket.emit("registerResult", { ok: false, code: payload });
      }
    });
  });

  //TODO: Create socket.on(login) that will see if the user is registered and validate via bcrypt if the password is the same or not
  socket.on("login", (userData) => {
    if (!userData || !userData.username || !userData.password) {
      socket.emit("loginResult", { ok: false, code: "INVALID_PAYLOAD" });
      return;
    }
    loginUser(userData.username, userData.password, (ok, payload) => {
      if (ok) {
        socket.emit("loginResult", { ok: true, userId: payload.userId });
      } else {
        socket.emit("loginResult", { ok: false, code: payload });
      }
    });
  });
  socket.on("saveUsername", (username) => {
    //Find the player
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;
    player.username = username;
    player.status = "not-joined"; // Estado inicial al guardar nombre
    io.emit("updatePlayerData", players);
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

      if (room.players.length === ROOM_CAPACITY) {
        // Marca la sala como llena y solicita a los jugadores que confirmen 'ready'
        room.isFull = true;
        // Emite al frontend que la sala está llena y los clientes deben mostrar el botón 'Ready'
        io.to(roomName).emit("roomFull", true);
        io.to(roomName).emit("requestReady");
      }
    }

    io.to(roomName).emit("updateRooms", rooms);
    io.to(roomName).emit("updateRoomPlayers", room.players);
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
        `Player ${player.username || player.id} set ready=${isReady} in room ${room.name}`,
      );
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

//Db stuff
//Connect to the database
const mysqlconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

let con = null;

//Connection to database with retries since our MySQL in development is far slower in startup than our express app.
function connectToDB(callback, retries = 10, delayMs = 2000) {
  con = sql.createConnection(mysqlconfig);

  con.connect((err) => {
    if (err) {
      console.log("Error connecting to database:", err.message);

      if (retries > 0) {
        console.log(
          `Retrying in ${delayMs / 1000} seconds... (${retries} retries left)`,
        );
        setTimeout(() => connectToDB(callback, retries - 1, delayMs), delayMs); //Retries connection to database;
      } else {
        console.log("All retries failed. Could not connect to the database.");
      }
    } else {
      console.log("Connection successful!");
      if (callback) callback(con); //Sets what we will add to the callback
    }
  });
}

function registerUser(username, password, done) {
  let user = username;
  let pass = password;
  bcrypt.hash(pass, 10, (err, hashedPassword) => {
    if (err) {
      done(false, "HASH_ERROR");
      return;
    }
    connectToDB((connection) => {
      const q1 = "SELECT id FROM users WHERE username = ?";
      connection.execute(q1, [user], (err, rows) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }
        if (rows && rows.length > 0) {
          done(false, "USER_EXISTS");
          return;
        }
        const q2 = "INSERT INTO users (username, password) VALUES (?,?)";
        connection.execute(q2, [user, hashedPassword], (err, results) => {
          if (err) {
            done(false, "DB_ERROR");
            return;
          }
          done(true, { userId: results.insertId });
        });
      });
    });
  });
}

function loginUser(username, password, done) {
  connectToDB((connection) => {
    const q = "SELECT id, password FROM users WHERE username = ?";
    connection.execute(q, [username], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      if (!rows || rows.length === 0) {
        done(false, "NOT_FOUND");
        return;
      }
      const user = rows[0];
      bcrypt.compare(password, user.password, (err, same) => {
        if (err) {
          done(false, "HASH_ERROR");
          return;
        }
        if (!same) {
          done(false, "INVALID_PASSWORD");
          return;
        }
        done(true, { userId: user.id });
      });
    });
  });
}

server.listen(3000, () => console.log("Server running on port:3000"));
