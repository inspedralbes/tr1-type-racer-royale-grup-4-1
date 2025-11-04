const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const sql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve el frontend de Vue
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ============================================================================
// CONFIGURACIÓN DE MULTER PARA IMÁGENES
// ============================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "img");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
    }
  }
});

// Sirve las imágenes estáticamente
app.use("/img", express.static(path.join(__dirname, "img")));

// Estado global
let players = [];
let rooms = [];
let leaderboard = [];

const ROOM_CAPACITY = 4;

// Socket.io logic
io.on("connection", (socket) => {
  const newPlayer = {
    id: socket.id,
    username: null,
    status: "waiting",
    room: null,
  };

  players.push(newPlayer);

  socket.on("register", (userData) => {
    registerUser(userData.username, userData.password, (ok, payload) => {
      socket.emit("registerResult", ok
        ? { ok: true, userId: payload.userId }
        : { ok: false, code: payload }
      );
    });
  });

  socket.on("login", (userData) => {
    if (!userData || !userData.username || !userData.password) {
      socket.emit("loginResult", { ok: false, code: "INVALID_PAYLOAD" });
      return;
    }
    loginUser(userData.username, userData.password, (ok, payload) => {
      socket.emit("loginResult", ok
        ? { ok: true, userId: payload.userId }
        : { ok: false, code: payload }
      );
    });
  });

  socket.on("saveUsername", (username) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;
    player.username = username;
    player.status = "not-joined";
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
        room.isFull = true;
        io.to(roomName).emit("roomFull", true);
        io.to(roomName).emit("requestReady");
      }
    }

    io.to(roomName).emit("updateRooms", rooms);
    io.to(roomName).emit("updateRoomPlayers", room.players);
  });

  socket.on("gameStart", () => {
    io.emit("gameStart");
  });

  function checkStartGame(room) {
    const allReady = room.players.every((p) => p.status === "ready");
    if (allReady && room.players.length > 1) {
      io.to(room.name).emit("gameStart");
      console.log("Game started in room:", room.name);
      room.players.forEach((p) => { p.status = "playing"; });
      io.to(room.name).emit("gameStarted", room.players);
    }
  }

  socket.on("playerReady", (isReady) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;
    player.status = isReady ? "ready" : "waiting";
    const room = rooms.find((r) => r.name === player.room);
    if (room) {
      io.to(room.name).emit("updateRoomPlayers", room.players);
      console.log(`Player ${player.username || player.id} set ready=${isReady} in room ${room.name}`);
      checkStartGame(room);
    }
  });

  socket.on("isRoomFull", (roomName) => {
    let room = rooms.find((r) => r.name === roomName);
    let roomFull = room ? room.players.length >= ROOM_CAPACITY : false;
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
    getArticlesFromDB((articles) => {
      socket.emit("articlesData", articles);
    });
  });

  socket.on("getRooms", () => {
    console.log(`[${socket.id}] Solicitando lista de salas (${rooms.length} salas disponibles)`);
    socket.emit("roomData", rooms);
    io.emit("updateRooms", rooms);
  });

  socket.on("leaveRoom", (roomName) => {
    console.log(`Jugador ${socket.id} está abandonando la sala: ${roomName}`);
    const room = rooms.find(r => r.name === roomName);
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      console.log(`Jugador ${socket.id} eliminado de la sala ${roomName}`);
      if (room.players.length === 0) {
        rooms = rooms.filter(r => r.name !== roomName);
        console.log(`Sala ${roomName} eliminada por estar vacía`);
      }
      io.emit("updateRooms", rooms);
      socket.leave(roomName);
      io.to(roomName).emit('playerLeft', { playerId: socket.id, roomName });
    }
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
    console.log(`User disconnected: ${socket.id} (${player ? player.username || "no-name" : "unknown"})`);

    const playerRooms = rooms.filter(room => room.players.some(p => p.id === socket.id));

    rooms.forEach(room => {
      const before = room.players.length;
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.players.length === 0) {
        rooms = rooms.filter(r => r.name !== room.name);
        console.log(`Sala ${room.name} eliminada por estar vacía`);
      } else if (before !== room.players.length) {
        io.to(room.name).emit("updateRoom", room);
        io.to(room.name).emit("gameStateUpdate", room.players);
      }
    });

    players = players.filter((p) => p.id !== socket.id);

    if (playerRooms.length > 0) {
      io.emit("updateRooms", rooms);
      playerRooms.forEach(room => {
        io.to(room.name).emit('playerLeft', { playerId: socket.id, roomName: room.name });
      });
    }
  });

  socket.on("error", (error) => {
    console.error(`[${socket.id}] Error de socket:`, error);
  });
});

// ============================================================================
// RUTAS HTTP - IMÁGENES
// ============================================================================
// Ruta para subir imagen de perfil
app.post("/api/upload-profile-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No se recibió ninguna imagen" });
    }

    const userId = req.body.userId;
    if (!userId) {
      // Eliminar archivo subido si no hay userId
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ ok: false, message: "userId es requerido" });
    }

    const imagePath = `/img/${req.file.filename}`;
    updateUserImage(userId, imagePath, (ok, payload) => {
      if (!ok) {
        // Eliminar archivo subido si falla la actualización
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ ok: false, message: "Error al actualizar imagen", code: payload });
      }

      res.json({ ok: true, imagePath: payload.img });
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});

// Ruta para obtener imagen de perfil
app.get("/api/get-profile-image/:userId", (req, res) => {
  const userId = req.params.userId;
  getUserImage(userId, (ok, payload) => {
    if (!ok) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado", code: payload });
    }
    res.json({ ok: true, imagePath: payload.img });
  });
});

// Configuración DB
const mysqlconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

let con = null;

function connectToDB(callback, retries = 10, delayMs = 2000) {
  con = sql.createConnection(mysqlconfig);
  con.connect((err) => {
    if (err) {
      console.log("Error connecting to database:", err.message);
      if (retries > 0) {
        console.log(`Retrying in ${delayMs / 1000} seconds... (${retries} retries left)`);
        setTimeout(() => connectToDB(callback, retries - 1, delayMs), delayMs);
      } else {
        console.log("All retries failed. Could not connect to the database.");
      }
    } else {
      console.log("Connection successful!");
      if (callback) callback(con);
    }
  });
}

// Función para obtener artículos de la base de datos (solo articles_easy)
function getArticlesFromDB(callback) {
  connectToDB((connection) => {
    const query = `SELECT id, text FROM articles_easy`;
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error obteniendo artículos de la BBDD:', err);
        callback([]);
        return;
      }
      // Convertir los resultados al formato que espera el frontend
      const articles = results.map(row => ({
        id: row.id,
        text: row.text,
        completed: false
      }));
      callback(articles);
    });
  });
}

// ============================================================================
// FUNCIONES DE GESTIÓN DE IMÁGENES DE PERFIL
// ============================================================================
function getUserImage(userId, done) {
  connectToDB((connection) => {
    const q = "SELECT img FROM users WHERE id = ?";
    connection.execute(q, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      if (!rows || rows.length === 0) {
        done(false, "USER_NOT_FOUND");
        return;
      }
      done(true, { img: rows[0].img });
    });
  });
}

function updateUserImage(userId, imagePath, done) {
  connectToDB((connection) => {
    // Primero obtenemos la imagen anterior para eliminarla
    const q1 = "SELECT img FROM users WHERE id = ?";
    connection.execute(q1, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      const oldImage = rows && rows.length > 0 ? rows[0].img : null;

      // Actualizamos la ruta de la imagen en la BD
      const q2 = "UPDATE users SET img = ? WHERE id = ?";
      connection.execute(q2, [imagePath, userId], (err, results) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }

        // Eliminamos la imagen anterior del sistema de archivos si existe
        if (oldImage && oldImage !== imagePath) {
          const oldImagePath = path.join(__dirname, oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (unlinkErr) => {
              if (unlinkErr) console.error("Error al eliminar imagen antigua:", unlinkErr);
            });
          }
        }

        done(true, { img: imagePath });
      });
    });
  });
}

function registerUser(username, password, done) {
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      done(false, "HASH_ERROR");
      return;
    }
    connectToDB((connection) => {
      const q1 = "SELECT id FROM users WHERE username = ?";
      connection.execute(q1, [username], (err, rows) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }
        if (rows && rows.length > 0) {
          done(false, "USER_EXISTS");
          return;
        }
        const q2 = "INSERT INTO users (username, password) VALUES (?, ?)";
        connection.execute(q2, [username, hashedPassword], (err, results) => {
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
