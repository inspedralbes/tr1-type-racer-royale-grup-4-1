<template>
  <div>
    <!-- Botón para abrir el popup -->
    <button class="config-button" aria-label="Configuración" @click="isOpen = true">
      <i class="fa-solid fa-gear"></i>
    </button>

    <!-- Popup -->
    <div v-if="isOpen" class="overlay" @click="isOpen = false">
      <div class="popup" @click.stop>
        <button class="close-button" @click="isOpen = false">×</button>
        
        <h3>Configuración Usuario</h3>
        
        <!-- Foto de usuario -->
        <div class="user-photo">
          <img src="data:image/jpeg;base64,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" alt="Usuario" />
        </div>

        <!-- Nombre -->
        <h2>Jugador</h2>

        <div class="buttons">
          <button class="btn">Cambiar foto</button>  
          <button class="btn">Cambiar nombre</button>
        </div>

        <!-- Estadísticas -->
        <div class="stats">
          <div>Partidas Ganadas: <strong>0</strong></div>
          <div>Mejor Puntuación: <strong>0</strong></div>
        </div>

        <hr>

        <h3>Configuración Juego</h3>

        <!-- Volumen -->
        <div class="volume">
          <label>Volumen</label>
          <input type="range" v-model="volume" @input="changeVolume" min="0" max="100" />
          <span>{{ volume }}%</span>
        </div>

        <!-- Modo oscuro -->
        <label class="dark-mode">
          <input type="checkbox" v-model="isDarkMode" @change="toggleDarkMode" />
          Modo oscuro
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
const isDarkMode = ref(false);
const volume = ref(50);

const toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode', isDarkMode.value);
};

const changeVolume = () => {
  // Aquí puedes controlar el volumen de tu música
  console.log('Volumen:', volume.value);
};
</script>

<style scoped>
.config-button {
  position: absolute;
  bottom: 6vh;
  right: 5vw;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  width: 56px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.config-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.config-button i {
  font-size: 1.25rem;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 350px;
  text-align: center;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
}

h3 {
  margin: 1rem 0;
  color: #666;
}

.user-photo {
  width: 80px;
  height: 80px;
  margin: 1rem auto;
  border-radius: 50%;
  overflow: hidden;
}

.user-photo img {
  width: 100%;
  height: 100%;
}

h2 {
  margin: 0.5rem 0 1rem 0;
  color: #333;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.stats {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stats div {
  padding: 0.5rem 0;
  color: #666;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1.5rem 0;
}

.volume {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  justify-content: center;
}

.volume input {
  width: 150px;
}

.volume span {
  min-width: 40px;
}

.dark-mode {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  justify-content: center;
  margin: 1rem 0;
}
</style>

<style>
body.dark-mode {
  background: #1a1a1a;
  color: #000000;
}
</style>