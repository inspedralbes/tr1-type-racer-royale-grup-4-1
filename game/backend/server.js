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

// Configuración de CORS
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
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
          console.log(
            `✅ Usuario registrado: ${userData.username} con userId: ${payload.userId} asignado al socket: ${socket.id}`,
          );

          getUserImage(payload.userId, (imgOk, imgPayload) => {
            if (imgOk && imgPayload.img) {
              player.profileImage = imgPayload.img;
            }
          });
        } else {
          console.log(
            `❌ No se encontró el jugador con socket.id: ${socket.id} para asignar userId`,
          );
        }
        socket.emit("registerResult", {
          ok: true,
          userId: payload.userId,
          username: userData.username,
        });
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
          console.log(
            `✅ Usuario logueado: ${userData.username} con userId: ${payload.userId} asignado al socket: ${socket.id}`,
          );

          getUserImage(payload.userId, (imgOk, imgPayload) => {
            if (imgOk && imgPayload.img) {
              player.profileImage = imgPayload.img;
            }
          });
        } else {
          console.log(
            `❌ No se encontró el jugador con socket.id: ${socket.id} para asignar userId`,
          );
        }

        socket.emit("loginResult", {
          ok: true,
          userId: payload.userId,
          username: userData.username,
        });
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

  socket.on("joinRoom", (data) => {
    // Support both old format (string) and new format (object)
    let roomName, userId, username;
    if (typeof data === "string") {
      roomName = data;
    } else {
      roomName = data.roomName;
      userId = data.userId;
      username = data.username;
    }

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

    // Update player with userId and username if provided
    if (userId) {
      player.userId = userId;
      console.log(
        `✅ UserId ${userId} asignado al jugador ${socket.id} al unirse a la sala`,
      );
    }
    if (username) {
      player.username = username;
    }

    // Verificar y deducir entrada para modo Muerte Súbita
    if (room.gameMode === "muerte-subita") {
      if (!userId) {
        socket.emit("joinRoomFailed", {
          message:
            "Debes iniciar sesión para unirte a una sala de Muerte Súbita",
        });
        return;
      }

      // Deducir la entrada de 100
      updateUserMoney(userId, -100, (ok, payload) => {
        if (!ok) {
          socket.emit("joinRoomFailed", {
            message: "No tienes suficiente dinero (necesitas 100)",
          });
          return;
        }

        console.log(
          `Entrada de 100 deducida al unirse a sala Muerte Súbita. Nuevo balance: ${payload.money}`,
        );
        socket.emit("moneyUpdated", { newMoney: payload.money });

        // Añadir la entrada al bote
        room.bets[socket.id] = 100;
        room.totalPot += 100;

        // Continuar con la unión a la sala
        joinRoomAfterPayment();
      });
    } else {
      socket.join(roomName);
      joinRoomAfterPayment();
    }

    function joinRoomAfterPayment() {
      socket.join(roomName);

      if (!room.scores.find((s) => s.id === socket.id)) {
        room.scores.push({
          id: socket.id,
          username: player.username,
          articlesDone: 0,
          progress: 0,
          errors: 0,
        });
        io.to(roomName).emit("leaderboardUpdateInRoom", room.scores);
      }
      if (!room.players.find((p) => p.id === socket.id)) {
        player.room = roomName;
        player.status = "waiting";
        room.players.push(player);

        // CÓDIGO ANTERIOR: if (room.players.length === ROOM_CAPACITY) {
        // MODIFICADO: Usar room.maxPlayers para validación dinámica de capacidad
        if (room.players.length === (room.maxPlayers || 4)) {
          room.isFull = true;
          io.to(roomName).emit("roomFull", true);
          io.to(roomName).emit("requestReady");
        }
      }
      io.to(roomName).emit("updateRooms", rooms);
      io.to(roomName).emit("updateRoomPlayers", room.players);

      // Enviar el bote total actual al jugador que se une
      if (room.totalPot > 0) {
        socket.emit("updateTotalPot", room.totalPot);
        io.to(roomName).emit("updateTotalPot", room.totalPot);
      }
    }
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
    // CÓDIGO ANTERIOR: let roomFull = room ? room.players.length >= ROOM_CAPACITY : false;
    // MODIFICADO: Usar room.maxPlayers para verificar si está llena
    let roomFull = room ? room.players.length >= (room.maxPlayers || 4) : false;
    socket.emit("roomFull", roomFull);
  });

  socket.on("createRoom", (data) => {
    const roomName = data.name;
    const difficulty = data.difficulty;
    const maxPlayers = data.maxPlayers || 4; // ← AÑADIDO: Capacidad configurable (2-4, por defecto 4)
    console.log(`Creating room ${roomName} with difficulty ${difficulty}`);
    const gameMode = data.gameMode || "normal";
    const userId = data.userId;
    const username = data.username;

    let roomExists = rooms.find((r) => r.name === roomName);
    if (!roomExists) {
      const newRoom = {
        name: roomName,
        difficulty: difficulty,
        maxPlayers: maxPlayers, // ← AÑADIDO: Guardar capacidad máxima
        gameMode: gameMode,
        players: [],
        status: "waiting",
        scores: [],
        bets: {},
        totalPot: 0,
        entryFee: gameMode === "muerte-subita" ? 100 : 0,
        eliminatedPlayers: [],
      };
      rooms.push(newRoom);

      let player = players.find((p) => p.id === socket.id);
      if (player) {
        // Update player with userId and username if provided
        if (userId) {
          player.userId = userId;
          console.log(
            `✅ UserId ${userId} asignado al jugador ${socket.id} al crear la sala`,
          );
        }
        if (username) {
          player.username = username;
        }

        // Verificar y deducir entrada para modo Muerte Súbita
        if (gameMode === "muerte-subita") {
          if (!userId) {
            socket.emit("roomCreationFailed", {
              message:
                "Debes iniciar sesión para crear una sala de Muerte Súbita",
            });
            rooms = rooms.filter((r) => r.name !== roomName);
            return;
          }

          // Deducir la entrada de 100
          updateUserMoney(userId, -100, (ok, payload) => {
            if (!ok) {
              socket.emit("roomCreationFailed", {
                message:
                  "No tienes suficiente dinero para crear una sala de Muerte Súbita (necesitas 100)",
              });
              rooms = rooms.filter((r) => r.name !== roomName);
              return;
            }

            console.log(
              `Entrada de 100 deducida al crear sala Muerte Súbita. Nuevo balance: ${payload.money}`,
            );
            socket.emit("moneyUpdated", { newMoney: payload.money });

            // Añadir la entrada al bote
            newRoom.totalPot = 100;
            newRoom.bets[socket.id] = 100;

            // Continuar con la creación de la sala
            joinRoomAfterPayment();
          });
        } else {
          joinRoomAfterPayment();
        }

        function joinRoomAfterPayment() {
          socket.join(roomName);
          player.room = roomName;
          player.status = "waiting";
          newRoom.players.push(player);
          newRoom.scores.push({
            id: socket.id,
            username: player.username,
            articlesDone: 0,
            progress: 0,
            errors: 0,
          });
          console.log(
            `Player ${player.username || socket.id} created and joined room ${roomName}`,
          );
          io.to(roomName).emit("updateRoomPlayers", newRoom.players);
          io.emit("updateRooms", rooms);

          if (newRoom.totalPot > 0) {
            io.to(roomName).emit("updateTotalPot", newRoom.totalPot);
          }
        }
      } else {
        io.emit("updateRooms", rooms);
      }
    } else {
      console.log("Room already exists!");
    }
  });

  socket.on("getArticles", () => {
    const player = players.find((p) => p.id === socket.id);
    const room = player.room;
    const roomDificulty = rooms.find((r) => r.name === room).difficulty;
    console.log(
      `Getting articles for room ${player.room} with difficulty ${roomDificulty}`,
    );
    console.log(
      `Current rooms: ${JSON.stringify(rooms.map((r) => ({ name: r.name, difficulty: r.difficulty })))}`,
    );
    getArticlesFromDB(roomDificulty, (articles) => {
      // Limitar a 4 artículos: cada artículo representa el 25% del progreso total
      const limitedArticles = articles.slice(0, 4);
      socket.emit("articlesData", limitedArticles);
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
      const player = players.find((p) => p.id === socket.id);
      room.players = room.players.filter((p) => p.id !== socket.id);
      console.log(`Jugador ${socket.id} eliminado de la sala ${roomName}`);

      // Devolver la apuesta del jugador a la base de datos y recalcular el bote
      // EXCEPTO en modo Muerte Súbita donde la entrada no se devuelve
      if (room.bets && room.bets[socket.id] && player && player.userId) {
        const refundAmount = room.bets[socket.id];

        // Solo devolver si NO es modo Muerte Súbita
        if (room.gameMode !== "muerte-subita") {
          // Devolver el dinero a la base de datos
          updateUserMoney(player.userId, refundAmount, (ok, payload) => {
            if (ok) {
              console.log(
                `Apuesta de ${refundAmount} devuelta al jugador ${socket.id}. Nuevo dinero: ${payload.money}`,
              );
              // Notificar al jugador su nuevo balance
              socket.emit("betRefunded", { newMoney: payload.money });
            } else {
              console.error(
                `Error al devolver apuesta al jugador ${socket.id}`,
              );
            }
          });
        } else {
          console.log(`Entrada de ${refundAmount} NO devuelta (Muerte Súbita)`);
        }

        delete room.bets[socket.id];
        room.totalPot = Object.values(room.bets).reduce(
          (sum, bet) => sum + bet,
          0,
        );

        // Notificar a los demás del nuevo bote total
        io.to(roomName).emit("updateTotalPot", room.totalPot);
        console.log(`Nuevo bote total: ${room.totalPot}`);
      }

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
      // Al completar un artículo, el progreso del artículo actual vuelve a 0
      userScore.progress = 0;
      io.to(player.room).emit("leaderboardUpdateInRoom", room.scores);
    }
  });

  // Actualizar progreso de caracteres en tiempo real
  socket.on("updateProgress", (data) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player || !player.room) return;
    const room = rooms.find((r) => r.name === player.room);
    if (!room) return;

    let userScore = room.scores.find((s) => s.id === socket.id);
    if (userScore) {
      userScore.progress = data.progress; // Porcentaje de 0-100
      io.to(player.room).emit("leaderboardUpdateInRoom", room.scores);
    }
  });

  // Notificación de milestone a toda la sala
  socket.on("playerMilestone", (data) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player || !player.room) return;

    // Emitir a toda la sala (incluyendo al emisor)
    io.to(player.room).emit("playerMilestone", {
      username: player.username,
      percent: data.percent,
      articleNumber: data.articleNumber,
    });
  });

  // Notificación de error a toda la sala
  socket.on("playerError", (data) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player || !player.room) return;

    const room = rooms.find((r) => r.name === player.room);
    if (!room) return;

    // Si es modo Muerte Súbita y el jugador comete un error, eliminarlo
    if (room.gameMode === "muerte-subita" && data.errorCount > 0) {
      // Marcar al jugador como eliminado
      if (!room.eliminatedPlayers) {
        room.eliminatedPlayers = [];
      }

      if (!room.eliminatedPlayers.includes(socket.id)) {
        room.eliminatedPlayers.push(socket.id);

        // Notificar al jugador que fue eliminado
        socket.emit("eliminatedFromGame", {
          message:
            "Has sido eliminado por cometer un error en modo Muerte Súbita",
        });

        // Notificar a toda la sala
        io.to(player.room).emit("playerEliminated", {
          username: player.username,
          playerId: socket.id,
        });

        console.log(
          `Jugador ${player.username} eliminado de sala ${player.room} por error en Muerte Súbita`,
        );

        // Verificar si solo queda un jugador activo
        const activePlayers = room.players.filter(
          (p) => !room.eliminatedPlayers.includes(p.id),
        );
        if (activePlayers.length === 1) {
          // Hay un ganador
          const winner = activePlayers[0];
          const totalPot = room.totalPot || 0;

          if (winner.userId && totalPot > 0) {
            updateUserMoney(winner.userId, totalPot, (ok, payload) => {
              if (ok) {
                console.log(
                  `Ganador ${winner.username} recibió ${totalPot}. Nuevo balance: ${payload.money}`,
                );
              }
            });
          }

          // Preparar datos del podio
          const podiumData = {
            rankings: [
              {
                position: 1,
                username: winner.username,
                articlesCompleted: 0,
                errors: 0,
                progress: 0,
              },
            ],
            totalPot: totalPot,
            winner: winner.username,
            gameMode: "muerte-subita",
          };

          // Mostrar podio
          io.to(player.room).emit("showPodium", podiumData);
          room.status = "finished";
        }
      }
    }

    // Emitir a toda la sala EXCEPTO al emisor (usando broadcast)
    socket.broadcast.to(player.room).emit("playerError", {
      username: player.username,
      errorCount: data.errorCount,
    });
  });
  socket.on("placeBet", (data) => {
    const { roomName, amount, previousBet } = data;
    if (!roomName || amount == null || amount <= 0) {
      socket.emit("betConfirmed", {
        success: false,
        message: "Datos de apuesta inválidos",
      });
      return;
    }

    const room = rooms.find((r) => r.name === roomName);
    if (!room) {
      socket.emit("betConfirmed", {
        success: false,
        message: "Sala no encontrada",
      });
      return;
    }

    const player = players.find((p) => p.id === socket.id);
    if (!player) {
      console.log(`❌ Jugador no encontrado con socket.id: ${socket.id}`);
      socket.emit("betConfirmed", {
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    if (!player.userId) {
      console.log(
        `❌ Jugador ${player.username} no tiene userId asignado. Player:`,
        player,
      );
      socket.emit("betConfirmed", {
        success: false,
        message: "Usuario no encontrado - sin userId",
      });
      return;
    }

    console.log(
      `✅ Player ${player.username} (userId: ${player.userId}) intentando apostar ${amount}`,
    );

    // Calcular la diferencia entre la nueva apuesta y la anterior
    const currentBet = room.bets[socket.id] || 0;
    const difference = amount - currentBet;

    // Actualizar el dinero en la base de datos (descontar la diferencia)
    updateUserMoney(player.userId, -difference, (ok, payload) => {
      if (!ok) {
        socket.emit("betConfirmed", {
          success: false,
          message: "Error al actualizar dinero en la base de datos",
        });
        return;
      }

      // Guardar la apuesta del jugador
      room.bets[socket.id] = amount;

      // Actualizar el bote total
      room.totalPot = Object.values(room.bets).reduce(
        (sum, bet) => sum + bet,
        0,
      );

      console.log(
        `Apuesta colocada: ${player.username} apostó ${amount} en ${roomName}. Diferencia: ${difference}. Bote total: ${room.totalPot}. Nuevo dinero: ${payload.money}`,
      );

      // Confirmar al jugador que apostó, enviando el nuevo balance
      socket.emit("betConfirmed", { success: true, newMoney: payload.money });

      // Notificar a todos en la sala del nuevo bote total
      io.to(roomName).emit("updateTotalPot", room.totalPot);
    });
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

  //Game ended logic - when timer runs out
  socket.on("gameEnded", (finalData) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player || !player.room) return;

    const room = rooms.find((r) => r.name === player.room);
    if (!room) return;

    // Update final score for this player
    let userScore = room.scores.find((s) => s.id === socket.id);
    if (userScore) {
      userScore.articlesDone = finalData.articlesCompleted;
      userScore.errors = finalData.totalErrors;
      userScore.progress = finalData.progress;
      userScore.finished = true;
    }

    console.log(`Player ${player.username} finished game with:`, finalData);

    // Check if all players have finished
    const allFinished = room.players.every((p) => {
      const score = room.scores.find((s) => s.id === p.id);
      return score && score.finished;
    });

    if (allFinished) {
      // Calculate final rankings
      const rankings = room.scores.sort((a, b) => {
        // Sort by articles completed first
        if (b.articlesDone !== a.articlesDone) {
          return b.articlesDone - a.articlesDone;
        }
        // Then by errors (fewer is better)
        if (a.errors !== b.errors) {
          return a.errors - b.errors;
        }
        // Then by progress
        return b.progress - a.progress;
      });

      // Award prize money to winner
      const winner = rankings[0];
      const winnerPlayer = players.find((p) => p.id === winner.id);
      const totalPot = room.totalPot || 0;

      if (winnerPlayer && winnerPlayer.userId && totalPot > 0) {
        updateUserMoney(winnerPlayer.userId, totalPot, (ok, payload) => {
          if (ok) {
            console.log(
              `Winner ${winnerPlayer.username} received ${totalPot}. New balance: ${payload.money}`,
            );
          }
        });
      }

      // Prepare podium data
      const podiumData = {
        rankings: rankings.map((score, index) => ({
          position: index + 1,
          username: score.username,
          articlesCompleted: score.articlesDone,
          errors: score.errors || 0,
          progress: score.progress || 0,
        })),
        totalPot: totalPot,
        winner: winner.username,
      };

      // Send podium data to all players in the room
      io.to(player.room).emit("showPodium", podiumData);

      console.log(
        `Game ended in room ${player.room}. Winner: ${winner.username}`,
      );

      // Reset room state
      room.status = "finished";
    }
  });

  socket.on("timeOut", () => {
    const player = players.find((p) => p.id === socket.id);
    if (player && player.room) {
      io.to(player.room).emit("timeRanOut");
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

      // Eliminar la apuesta del jugador y recalcular el bote
      // En Muerte Súbita, la entrada se queda en el bote
      if (room.bets && room.bets[socket.id]) {
        const betAmount = room.bets[socket.id];
        delete room.bets[socket.id];
        room.totalPot = Object.values(room.bets).reduce(
          (sum, bet) => sum + bet,
          0,
        );
        io.to(room.name).emit("updateTotalPot", room.totalPot);
        console.log(
          `Apuesta de ${betAmount} eliminada por desconexión. Nuevo bote total: ${room.totalPot}`,
        );
      }

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
    res.json({
      ok: true,
      username: payload.username,
      imagePath: payload.img,
      money: payload.money,
    });
  });
});

app.get("/api/get-user-money/:userId", (req, res) => {
  const userId = req.params.userId;
  getUserMoney(userId, (ok, payload) => {
    if (!ok) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado", code: payload });
    }
    res.json({ ok: true, money: payload.money });
  });
});

app.post("/api/update-user-money", (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || amount == null) {
    return res
      .status(400)
      .json({ ok: false, message: "userId y amount son requeridos" });
  }
  updateUserMoney(userId, amount, (ok, payload) => {
    if (!ok) {
      return res.status(500).json({
        ok: false,
        message: "Error al actualizar dinero",
        code: payload,
      });
    }
    res.json({ ok: true, money: payload.money });
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
    const q = "SELECT username, img, money FROM users WHERE id = ?";
    connection.execute(q, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      if (!rows || rows.length === 0) {
        done(false, "USER_NOT_FOUND");
        return;
      }
      done(true, {
        username: rows[0].username,
        img: rows[0].img,
        money: rows[0].money || 0,
      });
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

function getUserMoney(userId, done) {
  connectToDB((connection) => {
    const q = "SELECT money FROM users WHERE id = ?";
    connection.execute(q, [userId], (err, rows) => {
      if (err) {
        done(false, "DB_ERROR");
        return;
      }
      if (!rows || rows.length === 0) {
        done(false, "USER_NOT_FOUND");
        return;
      }
      done(true, { money: rows[0].money || 0 });
    });
  });
}

function updateUserMoney(userId, amount, done) {
  connectToDB((connection) => {
    // First check current money if we're deducting
    if (amount < 0) {
      const checkQuery = "SELECT money FROM users WHERE id = ?";
      connection.execute(checkQuery, [userId], (err, rows) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }
        if (!rows || rows.length === 0) {
          done(false, "USER_NOT_FOUND");
          return;
        }

        const currentMoney = rows[0].money || 0;
        if (currentMoney + amount < 0) {
          done(false, "INSUFFICIENT_FUNDS");
          return;
        }

        // Proceed with the update
        performUpdate();
      });
    } else {
      // For positive amounts, proceed directly
      performUpdate();
    }

    function performUpdate() {
      const q = "UPDATE users SET money = money + ? WHERE id = ?";
      connection.execute(q, [amount, userId], (err, results) => {
        if (err) {
          done(false, "DB_ERROR");
          return;
        }
        // Get the updated money value
        const q2 = "SELECT money FROM users WHERE id = ?";
        connection.execute(q2, [userId], (err, rows) => {
          if (err) {
            done(false, "DB_ERROR");
            return;
          }
          if (!rows || rows.length === 0) {
            done(false, "USER_NOT_FOUND");
            return;
          }
          done(true, { money: rows[0].money || 0 });
        });
      });
    }
  });
}

server.listen(3000, () => console.log("Server running on port 3000"));
