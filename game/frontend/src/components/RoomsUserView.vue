<template>
  <div class="salas-container">
    <h1>SALAS</h1>
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
        class="Button" 
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

.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.sala-btn {
  padding: 1rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.sala-btn:hover {
  border-color: #888;
}

.sala-btn.selected {
  border-color: #007bff;
  background-color: #e6f0ff;
}

.unirse-container {
  margin-top: 1rem;
}

.Button {
  padding: 0.8rem 1.5rem;
  background-color: #007bff;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.Button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.salas-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #7b88c4 0%, #8a99d1 100%);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #000;
}

.salas-grid {
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sala-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #7c5dbf;
  padding: 1.2rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.Button {
    padding: 1rem 3rem;
    font-size: 1.5rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
}

.sala-btn:hover {
  background: #6b4da8;
  transform: scale(1.02);
}

.sala-nombre {
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
}

.sala-capacidad {
  font-size: 1.5rem;
  color: #000;
}

.actions {
  width: 100%;
  max-width: 600px;
}

.buscar-input {
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  width: 100%;
  text-align: center;
}
</style>