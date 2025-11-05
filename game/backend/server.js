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

// Parse JSON bodies for debug endpoints
app.use(express.json());

// Debug HTTP endpoint to save a result without using sockets
app.post('/debug/save-result', (req, res) => {
  const payload = req.body || {};
  const username = payload.username;
  const time = payload.time;
  const errors = payload.errors;
  const user_id = payload.user_id || null;

  if (!username || time == null || errors == null) {
    return res.status(400).json({ ok: false, error: 'INVALID_PAYLOAD' });
  }

  connectToDB((connection) => {
    const insertQuery = 'INSERT INTO results (user_id, username, time_ms, errors) VALUES (?, ?, ?, ?)';
    const params = [user_id, username, time, errors];
    console.log('HTTP debug save-result params:', params);
    connection.execute(insertQuery, params, (err, results) => {
      if (err) {
        console.log('Error saving via debug endpoint:', err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
      return res.json({ ok: true, insertId: results.insertId });
    });
  });
});

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
        // Associate this socket/player with the newly created DB user
        const player = players.find((p) => p.id === socket.id);
        if (player) {
          player.userId = payload.userId;
          player.username = userData.username; // ensure player's username matches registered username
        }
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
        // Associate this socket/player with the logged-in DB user
        const player = players.find((p) => p.id === socket.id);
        if (player) {
          player.userId = payload.userId;
          player.username = userData.username; // use the registered username
        }
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

  socket.on("userResults", (userResults) => {
    if (!userResults) return;

    leaderboard.push({
      username: userResults.username,
      time: userResults.time,
      errors: userResults.errors,
    }); 
    socket.emit("updateLeaderboard", leaderboard);

    // Guardar en la base de datos
      connectToDB((connection) => {
        // Preferimos guardar el user_id si el socket tiene un usuario asociado
        const player = players.find((p) => p.id === socket.id);
        const userIdToSave = player && player.userId ? player.userId : null;
        const usernameToSave = player && player.username ? player.username : userResults.username;
        const insertQuery =
          "INSERT INTO results (user_id, username, time_ms, errors) VALUES (?, ?, ?, ?)";

        const params = [userIdToSave, usernameToSave, userResults.time, userResults.errors];
        console.log("Saving userResults to DB", { socketId: socket.id, params, userResults });

        connection.execute(insertQuery, params, (err, results) => {
          if (err) {
            console.log("Error guardando resultado:", err.message, err.code || "");
          } else {
            console.log("Resultado guardado en BD id=", results.insertId);
          }
        });
      });
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
    io.emit("updateRooms", rooms);
  });
});

//Db stuff
//Connect to the database
const mysqlconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
};

let con = null;

// Use a connection pool to simplify and stabilize DB access from multiple socket events.
const pool = sql.createPool(mysqlconfig);

function connectToDB(callback) {
  // For compatibility with existing code that expects a `connection` with execute(..., cb)
  if (callback) callback(pool);
}

// Quick check of pool connectivity (non-fatal)
pool.getConnection((err, connection) => {
  if (err) {
    console.log("Warning: could not get DB connection from pool:", err.message);
  } else {
    console.log("DB pool connection OK");
    connection.release();
  }
});

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
