<template>
  <BaseScreen class="lobby" @home="emit('back')">
    <div class="greeting">
      <span>Hola, {{ gameStore.username || 'reporter' }}</span>
      <span>Quants articles farem avui?</span>
    </div>

    <div class="actions">
      <button class="btn btn-primary lobby-button" @click="gameStore.playClickSound(); handleCreateRoom()">Crear sala</button>
      <button class="btn btn-primary lobby-button" @click="gameStore.playClickSound(); handleJoinRoom()">Unirse sala</button>
    </div>

    <button class="rules-trigger" @click="showRules = true">RULES</button>

    <Transition name="fade">
      <div v-if="showRules" class="rules-modal">
        <button class="rules-close" @click="showRules = false" aria-label="Tanca">
          &times;
        </button>
        <div class="rules-content card-paper card-paper--compact">
          <h2 class="rules-title">Journalism Race</h2>
          <div class="rules-scroll">
            <p>
              Journalism Race és una competició clandestina on periodistes en hores baixes s'enfronten per recuperar la seva reputació i guanyar premis econòmics. L'objectiu és escriure articles sota pressió, on la velocitat i l'exactitud són crucials.
            </p>
            <h3>Objectiu Principal</h3>
            <p>
              Escriure l'article assignat amb la màxima velocitat i precisió possible per superar els rivals, guanyar partides i acumular monedes, escalant així posicions al rànquing.
            </p>
            <h3>Mecànica del Joc (La "Nit de Redacció")</h3>
            <ul>
              <li><strong>Escriure l'Article:</strong> Tecleja el text que apareix a la pantalla. Cada lletra correcta fa avançar la teva barra de progrés; cada error et resta temps.</li>
              <li><strong>Gestió del Temps:</strong> El temps és limitat. Si s'esgota el rellotge, quedes desqualificat.</li>
              <li><strong>Progrés de la Sala:</strong> El panell dret mostra el progrés dels rivals. Si arriben al 100% abans que tu, s'enduen els diners.</li>
              <li><strong>Pot de Monedes:</strong> La quantitat es reparteix entre els dos primers classificats.</li>
              <li><strong>Consola de Successos:</strong> A sota del teu marcador, reporta fites dels rivals i avisos de l'editor.</li>
            </ul>
            <h3>Estratègia Clau</h3>
            <p>
              Mantén un equilibri entre velocitat i precisió. Els errors et resten punts i poden comportar penalitzacions. Observa el Progrés de la Sala per decidir si arriscar-te o esperar un error aliè. La recompensa final és la reputació i, potser, una nova oportunitat professional.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </BaseScreen>
</template>

<script setup>
import BaseScreen from './layout/BaseScreen.vue';
import { useGameStore } from '../stores/gameStore';
import { ref } from 'vue';

const gameStore = useGameStore();
const emit = defineEmits(['back', 'createRoom', 'joinRoom']);
const showRules = ref(false);

function handleCreateRoom() {
  emit('createRoom');
}

function handleJoinRoom() {
  // Enviar el username al servidor
  if (gameStore.username) {
    gameStore.manager.emit('saveUsername', gameStore.username);
  }

  // Configurar los listeners para actualización de salas
  gameStore.manager.on('roomData', (rooms) => {
    console.log('roomData recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  gameStore.manager.on('updateRooms', (rooms) => {
    console.log('updateRooms recibido en Lobby:', rooms);
    gameStore.setRooms(rooms);
  });
  
  // Solicitar la lista de salas disponibles
  gameStore.manager.emit('getRooms');
  
  // Navegar a la vista de salas
  emit('joinRoom');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;600&display=swap');

.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  height: 100vh;
  width: 100%;
  background: var(--color-secondary);
  font-family: 'Poppins', sans-serif;
  position: relative;
}

.lobby::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url('@/img/bgimage.png') no-repeat center center;
  background-size: cover;
  pointer-events: none;
}

.actions {
  position: absolute;
  top: 40%;
  right: 20%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-end;
}

.lobby-button {
  width: clamp(240px, 22vw, 280px);
  font-family: "Playfair Display", serif;
}

.actions .lobby-button:first-child {
  align-self: flex-start;
  margin-left: -5rem;
}

.greeting {
  position: absolute;
  top: 30%;
  left: 7%;
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  font-family: 'Poppins', sans-serif;
  color: var(--color-primary);
  text-transform: capitalize;
  text-shadow: var(--shadow-sm);
}

.greeting span:first-child {
  font-size: 2.1rem;
  font-weight: 700;
}

.greeting span:last-child {
  font-size: 1.4rem;
  font-weight: 400;
}

.rules-trigger {
  position: absolute;
  top: 18%;
  left: 38%;
  transform: translate(-50%, -50%) rotate(-5deg);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  color: var(--color-primary);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  z-index: 10;
}

.rules-trigger:hover {
  transform: translate(-50%, -50%) rotate(-5deg) translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.rules-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  z-index: 200;
}

.rules-content {
  width: min(600px, 90vw);
  max-height: min(80vh, 520px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rules-title {
  margin: 0;
  text-align: center;
  color: var(--color-primary);
}

.rules-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: var(--spacing-sm);
}

.rules-scroll ul {
  margin: 0.2rem 0 0.6rem 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rules-scroll h3 {
  margin: 0.4rem 0 0.2rem 0;
  color: var(--color-primary);
}

.rules-scroll p {
  margin: 0.2rem 0 0.6rem 0;
}

.rules-scroll li strong {
  color: var(--color-primary);
}

.rules-close {
  position: absolute;
  top: 10vh;
  right: 23vw;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: var(--text-white);
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.rules-close:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    gap: 1.5rem;
  }

  .lobby-button {
    width: 220px;
  }
}
</style>
