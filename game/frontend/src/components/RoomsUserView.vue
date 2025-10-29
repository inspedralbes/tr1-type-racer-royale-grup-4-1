<template>
  <div class="salas-container">
    <button class="back-button" aria-label="Volver" @click="emit('back')">
      <i class="fa-solid fa-house"></i>
    </button>
    <h1 class="title">SALAS</h1>
    <br />
  <Config />

    
    <div class="salas-grid">
      <button 
        v-for="sala in salasFiltradas" 
        :key="sala.id"
        :class="['sala-btn', { 'selected': sala.id === salaSeleccionada }]"
        @click="seleccionarSala(sala.id)"
      >
        <span class="sala-nombre">{{ sala.nombre }}</span>
        <span class="sala-capacidad">{{ sala.jugadores }}/{{ maxJugadoresPorSala }}</span>
      </button>
    </div>

    <!-- Boton Unirse una vez selecionada la sala -->
    <div class="unirse-container">
      <button 
        class="btn" 
        :disabled="!salaSeleccionada"
        @click="unirseASala"
      >
        Unirse
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Config from './Config.vue';

const emit = defineEmits(['back']);

const maxJugadoresPorSala = ref(4);
const maxSalas = ref(4);


const salas = ref([
  { id: 1, nombre: 'Sala 1', jugadores: 1 },
  { id: 2, nombre: 'Sala 2', jugadores: 2 },
  { id: 3, nombre: 'Sala 3', jugadores: 3 },
  { id: 4, nombre: 'Sala 4', jugadores: 1 },

]);

const busqueda = ref('');

// Sala actualmente seleccionada
const salaSeleccionada = ref(null);

// Filtrar salas por búsqueda
const salasFiltradas = computed(() => {
  if (!busqueda.value) return salas.value;
  return salas.value.filter(sala => 
    sala.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
  );
});

// Selecciona una sala al hacer click
const seleccionarSala = (salaId) => {
  salaSeleccionada.value = salaId;
};

// Unirse a la sala seleccionada
const unirseASala = () => {
  if (!salaSeleccionada.value) return;
  console.log('Unirse a sala:', salaSeleccionada.value);
  // Aquí va tu lógica de socket para unirse a la sala


};
</script>


<style scoped>
.salas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
  position: relative;
}

.salas-grid {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sala-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  color: #000000;
  padding: 1.2rem 2rem;
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.sala-btn:hover {
  background-color: #f0f0f0;
  transform: scale(1.02);
  border-color: #4CAF50;
}

.sala-btn.selected {
  background-color: #ffffff;
  border-width: 3px;
}

.unirse-container {
  margin-top: 1rem;
}

.btn:disabled {
  background-color: #d0d0d0;
  color: #666666;
  cursor: not-allowed;
  transform: none;
}

.back-button {
  position: absolute;
  left: 5vw;
  bottom: 6vh;
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

.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.back-button i {
  font-size: 1.25rem;
}

.sala-nombre {
  font-size: 1.5rem;
  font-weight: bold;
  color: #222020;
}

.sala-capacidad {
  font-size: 1.5rem;
  color: #222020;
}
</style>