import { io } from "socket.io-client";

//To see if it's with development mode or not
const socketURL =
  import.meta.env.MODE === "development" 
    ? "http://localhost:3000" 
    : window.location.origin;

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
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      console.log("Conectado al servidor de socket");
      // Volver a registrar todos los callbacks después de reconectar
      Object.entries(this.callbacks).forEach(([event, callback]) => {
        this.socket.off(event, callback);
        this.socket.on(event, callback);
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Error de conexión:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Desconectado:", reason);
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Intentando reconectar (${attemptNumber})...`);
    });

    // Eliminado onAny para evitar doble invocación de callbacks (ya registramos con socket.on)
  }

  on(eventName, callback) {
    // Si ya existe un callback registrado para este evento, lo quitamos primero
    if (this.callbacks[eventName] && this.socket) {
      this.socket.off(eventName, this.callbacks[eventName]);
    }
    this.callbacks[eventName] = callback;
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName) {
    const existing = this.callbacks[eventName];
    if (existing && this.socket) {
      this.socket.off(eventName, existing);
    }
    delete this.callbacks[eventName];
  }
  //Sending the server data
  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }
}
