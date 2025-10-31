import { io } from "socket.io-client";

//To see if it's with development mode or not
const socketURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "http://backend:3000";

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  connect() {
    this.socket = io(socketURL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    this.socket.on("connect", () => {
      console.log("✅ Conectado al servidor de socket");
      // Volver a registrar todos los callbacks después de reconectar
      Object.entries(this.callbacks).forEach(([event, callback]) => {
        this.socket.on(event, callback);
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Desconectado:", reason);
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Intentando reconectar (${attemptNumber})...`);
    });

    this.socket.onAny((event, ...args) => {
      console.debug(`📡 Evento recibido [${event}]:`, ...args);
      if (this.callbacks[event]) {
        this.callbacks[event](...args);
      }
    });
  }

  on(eventName, callback) {
    this.callbacks[eventName] = callback;
    // Asegurarse de que el socket esté escuchando el evento
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }
  //Sending the server data
  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }
}
