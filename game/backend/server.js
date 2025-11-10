const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const sql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// CORS configuration based on environment
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost", // nginx local
  "http://127.0.0.1", // alternative localhost
];

const corsOptions = {
  origin: function (origin, callback) {
    // In production (behind nginx), allow all origins since nginx handles CORS
    // In development, check against allowedOrigins
    if (process.env.NODE_ENV === "production") {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // In production (behind nginx), allow all origins
      // In development, check against allowedOrigins
      if (process.env.NODE_ENV === "production") {
        callback(null, true);
      } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  },
  // Important: these settings help with proxy environments
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve el frontend de Vue
app.use(express.static(path.join(__dirname, "dist")));

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
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
    }
  },
});

// Sirve las imágenes estáticamente
app.use("/img", express.static(path.join(__dirname, "img")));

// Configuración DB
const mysqlconfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "typing_game",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
};

// Use a connection pool to simplify and stabilize DB access
const pool = sql.createPool(mysqlconfig);

function connectToDB(callback) {
  if (callback) callback(pool);
}

// Quick check of pool connectivity
pool.getConnection((err, connection) => {
  if (err) {
    console.log("Warning: could not get DB connection from pool:", err.message);
  } else {
    console.log("DB pool connection OK");
    connection.release();
  }
});

// Debug HTTP endpoint to save a result without using sockets
app.post("/debug/save-result", (req, res) => {
  const payload = req.body || {};
  const username = payload.username;
  const time = payload.time;
  const errors = payload.errors;
  const user_id = payload.user_id || null;

  if (!username || time == null || errors == null) {
    return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
  }

  connectToDB((connection) => {
    const insertQuery =
      "INSERT INTO results (user_id, username, time_ms, errors) VALUES (?, ?, ?, ?)";
    const params = [user_id, username, time, errors];
    console.log("HTTP debug save-result params:", params);
    connection.execute(insertQuery, params, (err, results) => {
      if (err) {
        console.log("Error saving via debug endpoint:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
      return res.json({ ok: true, insertId: results.insertId });
    });
  });
});

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
    userId: null,
    profileImage: null,
    status: "waiting",
    room: null,
  };

  players.push(newPlayer);

  socket.on("register", (userData) => {
    registerUser(userData.username, userData.password, (ok, payload) => {
      if (ok) {
        const player = players.find((p) => p.id === socket.id);
        if (player) {
          player.userId = payload.userId;
          player.username = userData.username;

          getUserImage(payload.userId, (imgOk, imgPayload) => {
            if (imgOk && imgPayload.img) {
              player.profileImage = imgPayload.img;
            }
          });
        }
        socket.emit("registerResult", { ok: true, userId: payload.userId });
      } else {
        socket.emit("registerResult", { ok: false, code: payload });
      }
    });
  });

  socket.on("login", (userData) => {
    if (!userData || !userData.username || !userData.password) {
      socket.emit("loginResult", { ok: false, code: "INVALID_PAYLOAD" });
      return;
    }

    loginUser(userData.username, userData.password, (ok, payload) => {
      if (ok) {
        const player = players.find((p) => p.id === socket.id);
        if (player) {
          player.userId = payload.userId;
          player.username = userData.username;

          getUserImage(payload.userId, (imgOk, imgPayload) => {
            if (imgOk && imgPayload.img) {
              player.profileImage = imgPayload.img;
            }
          });
        }

        socket.emit("loginResult", { ok: true, userId: payload.userId });
      } else {
        socket.emit("loginResult", { ok: false, code: payload });
      }
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

  socket.on("updateProfileImage", (userId) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;

    getUserImage(userId, (imgOk, imgPayload) => {
      if (imgOk && imgPayload.img) {
        player.profileImage = imgPayload.img;

        if (player.room) {
          const room = rooms.find((r) => r.name === player.room);
          if (room) {
            io.to(player.room).emit("updateRoomPlayers", room.players);
          }
        }
      }
    });
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
    if (!room.scores.find((s) => s.id === socket.id)) {
      room.scores.push({
        id: socket.id,
        username: player.username,
        articlesDone: 0,
      });
      //Try to update the roomScore to this
      io.to(roomName).emit("leaderboardUpdateInRoom", room.scores);
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
      console.log(
        `¡Todos los jugadores están listos en la sala ${room.name}! Iniciando cuenta regresiva...`,
      );

      io.to(room.name).emit("startCountdown");

      setTimeout(() => {
        room.status = "playing";
        room.players.forEach((p) => {
          p.status = "playing";
        });

        io.to(room.name).emit("gameStarted", room.players);
        io.emit("updateRooms", rooms);

        console.log(
          `Game started in room: ${room.name} - Status: ${room.status}`,
        );
      }, 3000);
    }
  }

  socket.on("playerReady", (isReady) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player) return;

    player.status = isReady ? "ready" : "waiting";
    const room = rooms.find((r) => r.name === player.room);

    if (room) {
      const roomPlayer = room.players.find((p) => p.id === socket.id);
      if (roomPlayer) {
        roomPlayer.status = isReady ? "ready" : "waiting";
      }
      io.to(room.name).emit("updateRoomPlayers", room.players);
      console.log(
        `Player ${player.username || player.id} set ready=${isReady} in room ${room.name}`,
      );
      checkStartGame(room);
    }
  });

  socket.on("isRoomFull", (roomName) => {
    let room = rooms.find((r) => r.name === roomName);
    let roomFull = room ? room.players.length >= ROOM_CAPACITY : false;
    socket.emit("roomFull", roomFull);
  });

  socket.on("createRoom", (data) => {
    const roomName = data.name;
    const difficulty = data.difficulty;

    let roomExists = rooms.find((r) => r.name === roomName);
    if (!roomExists) {
      const newRoom = {
        name: roomName,
        difficulty: difficulty,
        players: [],
        status: "waiting",
        scores: [],
      };
      rooms.push(newRoom);

      let player = players.find((p) => p.id === socket.id);
      if (player) {
        socket.join(roomName);
        //Since we're insta joining into the room make it so that we also update the score based on this
        player.room = roomName;
        player.status = "waiting";
        newRoom.players.push(player);
        newRoom.scores.push({
          id: socket.id,
          username: player.username,
          articlesDone: 0,
        });
        console.log(
          `Player ${player.username || socket.id} created and joined room ${roomName}`,
        );
        io.to(roomName).emit("updateRoomPlayers", newRoom.players);
      }
      io.emit("updateRooms", rooms);
    } else {
      console.log("Room already exists!");
    }
  });

  socket.on("getArticles", (data) => {
    const difficulty =
      rooms.find((r) => r.name === data?.roomName)?.difficulty || "easy";
    getArticlesFromDB(difficulty, (articles) => {
      socket.emit("articlesData", articles);
    });
  });

  socket.on("getRooms", () => {
    console.log(
      `[${socket.id}] Solicitando lista de salas (${rooms.length} salas disponibles)`,
    );
    socket.emit("roomData", rooms);
    io.emit("updateRooms", rooms);
  });

  socket.on("leaveRoom", (roomName) => {
    console.log(`Jugador ${socket.id} está abandonando la sala: ${roomName}`);
    const room = rooms.find((r) => r.name === roomName);
    if (room) {
      room.players = room.players.filter((p) => p.id !== socket.id);
      console.log(`Jugador ${socket.id} eliminado de la sala ${roomName}`);

      if (room.players.length === 0) {
        rooms = rooms.filter((r) => r.name !== roomName);
        console.log(`Sala ${roomName} eliminada por estar vacía`);
      } else {
        io.to(roomName).emit("updateRoomPlayers", room.players);
        console.log(`Sala ${roomName} mantiene su estado: ${room.status}`);
      }

      io.emit("updateRooms", rooms);
      socket.leave(roomName);
      io.to(roomName).emit("playerLeft", { playerId: socket.id, roomName });
    }
  });

  socket.on("articleCompleted", (articlesCompleted) => {
    let player = players.find((p) => p.id === socket.id);
    if (!player || !player.room) return;
    let room = rooms.find((r) => r.name === player.room);
    if (!room) return;

    let userScore = room.scores.find((s) => s.id === socket.id);
    if (userScore) {
      userScore.articlesDone = articlesCompleted;
      io.to(player.room).emit("leaderboardUpdateInRoom", room.scores);
    }
  });

  socket.on("userResults", (userResults) => {
    if (!userResults) return;

    leaderboard.push({
      username: userResults.username,
      time: userResults.time,
      errors: userResults.errors,
    });
    socket.emit("updateLeaderboard", leaderboard);

    connectToDB((connection) => {
      const player = players.find((p) => p.id === socket.id);
      const userIdToSave = player && player.userId ? player.userId : null;
      const usernameToSave =
        player && player.username ? player.username : userResults.username;
      const insertQuery =
        "INSERT INTO results (user_id, username, time_ms, errors) VALUES (?, ?, ?, ?)";

      const params = [
        userIdToSave,
        usernameToSave,
        userResults.time,
        userResults.errors,
      ];
      console.log("Saving userResults to DB", {
        socketId: socket.id,
        params,
        userResults,
      });

      connection.execute(insertQuery, params, (err, results) => {
        if (err) {
          console.log(
            "Error guardando resultado:",
            err.message,
            err.code || "",
          );
        } else {
          console.log("Resultado guardado en BD id=", results.insertId);
        }
      });
    });
  });

  //Timeout logic
  socket.on("timeOut", () => {
    const player = players.find((p) => p.id === socket.id);
    //TODO: Make it global instead, each user has the same time that starts
    //when they first start typing, when they reach the time limit
    //they emit "timeOut" to this, then emit to the room
    //that the time has ran out and do something with that event
    if (player && player.room) {
      io.to(player.room).emit("timeRanOut");
      //TODO: Maybe add a current score showcase so that the user's can see who did more
      //and thus obtain the money this way by who typed more articles in that time
    }
  });
  socket.on("disconnect", () => {
    const player = players.find((p) => p.id === socket.id);
    console.log(
      `User disconnected: ${socket.id} (${player ? player.username || "no-name" : "unknown"})`,
    );

    const playerRooms = rooms.filter((room) =>
      room.players.some((p) => p.id === socket.id),
    );

    rooms.forEach((room) => {
      const before = room.players.length;
      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.players.length === 0) {
        rooms = rooms.filter((r) => r.name !== room.name);
        console.log(`Sala ${room.name} eliminada por estar vacía`);
      } else if (before !== room.players.length) {
        io.to(room.name).emit("updateRoom", room);
        io.to(room.name).emit("updateRoomPlayers", room.players);
        console.log(`Sala ${room.name} mantiene su estado: ${room.status}`);
      }
    });

    players = players.filter((p) => p.id !== socket.id);

    if (playerRooms.length > 0) {
      io.emit("updateRooms", rooms);
      playerRooms.forEach((room) => {
        io.to(room.name).emit("playerLeft", {
          playerId: socket.id,
          roomName: room.name,
        });
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
app.post("/api/upload-profile-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "No se recibió ninguna imagen" });
    }

    const userId = req.body.userId;
    if (!userId) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ ok: false, message: "userId es requerido" });
    }

    const imagePath = `/img/${req.file.filename}`;
    updateUserImage(userId, imagePath, (ok, payload) => {
      if (!ok) {
        fs.unlinkSync(req.file.path);
        return res.status(500).json({
          ok: false,
          message: "Error al actualizar imagen",
          code: payload,
        });
      }

      res.json({ ok: true, imagePath: payload.img });
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});

app.get("/api/get-profile-image/:userId", (req, res) => {
  const userId = req.params.userId;
  getUserImage(userId, (ok, payload) => {
    if (!ok) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado", code: payload });
    }
    res.json({ ok: true, imagePath: payload.img });
  });
});

app.get("/api/get-user-info/:userId", (req, res) => {
  const userId = req.params.userId;
  getUserInfo(userId, (ok, payload) => {
    if (!ok) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado", code: payload });
    }
    res.json({ ok: true, username: payload.username, imagePath: payload.img });
  });
});

// ============================================================================
// FUNCIONES DE BASE DE DATOS
// ============================================================================
function getArticlesFromDB(difficulty, callback) {
  const validDifficulties = ["easy", "medium", "hard"];
  const tableName = `articles_${validDifficulties.includes(difficulty) ? difficulty : "easy"}`;

  connectToDB((connection) => {
    connection.query(`SELECT id, text FROM ${tableName}`, (err, results) => {
      if (err) {
        console.error(
          `Error obteniendo artículos de la BBDD (${tableName}):`,
          err,
        );
        return callback([]);
      }
      callback(
        results.map((row) => ({
          id: row.id,
          text: row.text,
          completed: false,
        })),
      );
    });
  });
}

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

function getUserInfo(userId, done) {
  connectToDB((connection) => {
    const q = "SELECT username, img FROM users WHERE id = ?";
    connection.execute(q, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      if (!rows || rows.length === 0) {
        done(false, "USER_NOT_FOUND");
        return;
      }
      done(true, { username: rows[0].username, img: rows[0].img });
    });
  });
}

function updateUserImage(userId, imagePath, done) {
  connectToDB((connection) => {
    const q1 = "SELECT img FROM users WHERE id = ?";
    connection.execute(q1, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      const oldImage = rows && rows.length > 0 ? rows[0].img : null;

      const q2 = "UPDATE users SET img = ? WHERE id = ?";
      connection.execute(q2, [imagePath, userId], (err, results) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }

        if (oldImage && oldImage !== imagePath) {
          const oldImagePath = path.join(__dirname, oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (unlinkErr) => {
              if (unlinkErr)
                console.error("Error al eliminar imagen antigua:", unlinkErr);
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
          done(true, { userId: results.insertId, username: username });
        });
      });
    });
  });
}

function loginUser(username, password, done) {
  connectToDB((connection) => {
    const q = "SELECT id, username, password FROM users WHERE username = ?";
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
        done(true, { userId: user.id, username: user.username });
      });
    });
  });
}

server.listen(3000, () => console.log("Server running on port 3000"));
