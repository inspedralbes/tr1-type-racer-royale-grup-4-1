<template>
  <div class="game-engine-wrapper">
    <EliminatedScreen v-if="isEliminated" :eliminationReason="eliminationReason" @back="handleBack" />

    <div v-else class="game-engine">
      <div v-if="gameState.isLoading" class="loading">
        <p>Cargando artículos...</p>
      </div>

      <template v-else>
        <div class="game-layout">
          <!-- User Scoreboard (Left side) -->
          <div class="user-scoreboard card-paper">
            <div
              class="timer-container"
              :class="{ 'timer-warning': timeRemaining <= 30 }"
            >
              <div class="timer-icon">
                <i class="fa-solid fa-clock"></i>
              </div>
              <div class="timer-display">
                <span class="timer-minutes">{{ formattedMinutes }}</span>
                <span class="timer-separator">:</span>
                <span class="timer-seconds">{{ formattedSeconds }}</span>
              </div>
            </div>
            <h3 class="user-scoreboard-title">Tu Progreso</h3>
            <div class="user-scoreboard-content">
              <div class="player-entry current-user">
                <div class="player-header">
                  <span class="player-name">{{ gameStore.username }}</span>
                  <span class="player-count"
                    >{{ Math.round(overallProgress) }}%</span
                  >
                </div>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width: overallProgress + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
            
            <!-- Game Console -->
            <div class="console-container">
              <GameConsole ref="gameConsole" :maxMessages="30" />
            </div>
          </div>

          <!-- Typing Section -->
          <div class="typing-area">
            <div v-if="!allCompleted" class="text-display card-paper">
              <span
                v-for="(letter, i) in currentArticle.inputText"
                :key="'input-' + i"
                :class="getLetterClass(i)"
              >
                {{ letter }}
              </span>
              <span class="remaining-text">{{ remainingText }}</span>
            </div>

            <div v-else class="game-completed card-paper">
              <h2>¡Todos los artículos completados!</h2>
              <p>
                Excelente trabajo, periodista. Has terminado todas las sesiones.
              </p>
            </div>

            <Keyboard class="typing-keyboard" :activeKey="activeKeyHighlight" />
          </div>

          <!-- Scoreboard Section -->
          <div class="scoreboard card-paper scoreboard--right">
            <h3 class="scoreboard-title">Room progress</h3>
            <div class="scoreboard-content">
              <div
                v-for="(score, index) in sortedScores"
                :key="score.id || index"
                class="player-entry surface-floating"
                :class="{
                  'is-leader':
                    index === 0 && getAggregatePercentForScore(score) > 0,
                }"
              >
                <div class="player-header">
                  <span class="player-name">
                    {{ score.username }}
                    <span
                      v-if="score.username === gameStore.username"
                      class="you-label"
                      >(you)</span
                    >
                  </span>
                  <span class="player-count"
                    >{{ Math.round(getAggregatePercentForScore(score)) }}%</span
                  >
                </div>

                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width: getAggregatePercentForScore(score) + '%',
                    }"
                  ></div>
                </div>
              </div>

              <div v-if="sortedScores.length === 0" class="empty-scoreboard">
                <p>Waiting for players...</p>
              </div>
            </div>

          </div>
        </div>
      </template>
    </div>

    <div v-if="gameStore.userId" class="game-money">
      <div class="money-icon">💰</div>
      <div class="money-value">{{ formattedMoney }} $</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useGameStore } from "../stores/gameStore";
import GameNotification from "./GameNotification.vue";
import EliminatedScreen from "./EliminatedScreen.vue";
import GameConsole from "./GameConsole.vue";
import Keyboard from "./Keyboard.vue";

const emit = defineEmits(["back"]);
const gameStore = useGameStore();

// Console reference
const gameConsole = ref(null);

// Function to add messages to console
function addConsoleMessage(message, type = 'info') {
  if (gameConsole.value) {
    gameConsole.value.addMessage(message, type);
  }
}

// Tracking de milestones ya notificados para evitar spam
const notifiedMilestones = ref(new Set());
const userScores = computed(() => gameStore.roomScore);
console.log(userScores);
const gameState = ref({
  articles: [],
  currentIndex: 0,
  totalErrors: 0,
  isLoading: true,
  completedArticles: 0,
});

const activeKeyHighlight = ref("");
const formattedMoney = computed(() => gameStore.money.toLocaleString());

// Track if player is eliminated (for sudden death mode)
const isEliminated = ref(false);
const eliminationReason = ref('error'); // 'error' or 'timeout'

// Store game mode locally
const gameMode = ref('normal');

// Get current room's game mode
const currentRoomData = computed(() => {
  return gameStore.rooms.find(r => r.name === gameStore.currentRoom);
});

// Watch for room data changes to update game mode
watch(currentRoomData, (newRoom) => {
  if (newRoom?.gameMode) {
    gameMode.value = newRoom.gameMode;
    console.log('🎮 Modo de juego detectado:', gameMode.value);
  }
}, { immediate: true });

// Timer state
const timeRemaining = ref(1800); // 1800 seconds (30 minutes)
const timerInterval = ref(null);

const formattedMinutes = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  return String(minutes).padStart(2, "0");
});

const formattedSeconds = computed(() => {
  const seconds = timeRemaining.value % 60;
  return String(seconds).padStart(2, "0");
});

function startCountdown() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }

  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
      
      // Avisos de tiempo restante
      if (timeRemaining.value === 60) {
        addConsoleMessage('⏰ ¡Queda 1 minuto!', 'warning');
      } else if (timeRemaining.value === 30) {
        addConsoleMessage('⚠️ ¡Solo quedan 30 segundos!', 'warning');
      } else if (timeRemaining.value === 10) {
        addConsoleMessage('🚨 ¡10 segundos restantes!', 'error');
      }
    } else {
      clearInterval(timerInterval.value);
      addConsoleMessage('⏰ ¡Tiempo agotado!', 'error');
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  console.log("Time's up!");
  
  // En modo muerte súbita, el tiempo agotado significa eliminación
  if (gameMode.value === 'muerte-subita') {
    console.log('💀 Tiempo agotado en modo Muerte Súbita - Eliminando jugador');
    addConsoleMessage('💀 ¡ELIMINADO! Tiempo agotado en modo Muerte Súbita', 'error');
    isEliminated.value = true;
    eliminationReason.value = 'timeout';
    
    // Notificar al servidor sobre la eliminación por tiempo
    gameStore.manager.emit("playerError", {
      errorCount: 1,
      reason: "timeout"
    });
    return;
  }
  
  // Send final results to server (solo en modo normal)
  const finalResults = {
    username: gameStore.username,
    articlesCompleted: gameState.value.completedArticles,
    totalErrors: gameState.value.totalErrors,
    progress: Math.round(overallProgress.value),
  };

  gameStore.manager.emit("gameEnded", finalResults);
}
const currentArticle = computed(() => {
  return (
    gameState.value.articles[gameState.value.currentIndex] || {
      text: "",
      inputText: "",
      completed: false,
    }
  );
});

const remainingText = computed(() => {
  if (!currentArticle.value.text) return "";
  const typedLength = currentArticle.value.inputText?.length || 0;
  return currentArticle.value.text.substring(typedLength);
});

const allCompleted = computed(() =>
  gameState.value.articles.every((a) => a.completed),
);

const totalArticles = computed(() => gameState.value.articles.length);

const sortedScores = computed(() => {
  const arr = Array.isArray(userScores.value) ? [...userScores.value] : [];
  return arr.sort((a, b) => {
    const pa = getAggregatePercentForScore(a);
    const pb = getAggregatePercentForScore(b);
    if (pb !== pa) return pb - pa; // mayor porcentaje primero
    const ad = (b.articlesDone || 0) - (a.articlesDone || 0);
    if (ad !== 0) return ad;
    return (a.username || "").localeCompare(b.username || "");
  });
});

const userScore = computed(() => {
  return (
    userScores.value.find((s) => s.username === gameStore.username) || {
      username: gameStore.username,
      articlesDone: 0,
    }
  );
});

// Porcentaje del artículo actual basado en caracteres escritos
const currentArticleProgress = computed(() => {
  if (!currentArticle.value.text || currentArticle.value.text.length === 0) {
    return 0;
  }
  const typedLength = currentArticle.value.inputText?.length || 0;
  return Math.min((typedLength / currentArticle.value.text.length) * 100, 100);
});

// Progreso total agregando artículos completados + avance del artículo actual
const overallProgress = computed(() => {
  const total = totalArticles.value || 0;
  if (total === 0) return 0;
  const partial = (currentArticleProgress.value || 0) / 100;
  const completed = gameState.value.completedArticles || 0;
  return Math.min(((completed + partial) / total) * 100, 100);
});

function getProgressPercentage(articlesDone) {
  if (totalArticles.value === 0) return 0;
  return Math.min((articlesDone / totalArticles.value) * 100, 100);
}

// Progreso agregado para un jugador: artículos completados + avance actual
function getAggregatePercentForScore(score) {
  const total = totalArticles.value || 0;
  if (total === 0) return 0;
  const completed = score?.articlesDone || 0;
  const partial = (score?.progress || 0) / 100;
  return Math.min(((completed + partial) / total) * 100, 100);
}

let textStartTime = 0;

function startTimer() {
  if (textStartTime === 0) {
    textStartTime = Date.now();
  }
}

function handleTextInput() {
  const article = currentArticle.value;
  if (!article) return;

  const newValue = article.inputText;

  // Calcular porcentaje del artículo actual basado en caracteres escritos
  const currentPercent = Math.round((newValue.length / article.text.length) * 100);

  if (currentPercent < 100) {
    gameStore.manager.emit("updateProgress", {
      progress: currentPercent,
    });
  }

  const milestones = [25, 50, 75, 100];
  if (
    milestones.includes(currentPercent) &&
    !notifiedMilestones.value.has(currentPercent)
  ) {
    notifiedMilestones.value.add(currentPercent);
    gameStore.manager.emit("playerMilestone", {
      percent: currentPercent,
      articleNumber: gameState.value.currentIndex + 1,
    });
  }

  // ✅ Complete article when typed length reaches target length, ignoring mistakes
  if (article.inputText.length >= article.text.length) {
    const timeTaken = Date.now() - textStartTime;
    completeArticle(timeTaken);
  }
}

function completeArticle(timeTaken) {
  const article = currentArticle.value;
  article.completed = true;
  gameState.value.completedArticles++;

  const userResults = {
    username: gameStore.username,
    time: timeTaken,
    errors: gameState.value.totalErrors,
    articleIndex: gameState.value.currentIndex,
    articlesCompleted: gameState.value.completedArticles,
  };

  console.log("Resultados del usuario:", userResults);
  gameStore.manager.emit("userResults", userResults);
  gameStore.manager.emit("articleCompleted", gameState.value.completedArticles);

  // Move to next article if available
  const nextIndex = gameState.value.articles.findIndex((a) => !a.completed);
  if (nextIndex !== -1) {
    gameState.value.currentIndex = nextIndex;
    textStartTime = 0;
    // Resetear milestones notificados para el nuevo artículo
    notifiedMilestones.value.clear();
  } else {
    console.log("Todos los artículos completados");
  }
}

function getLetterClass(index) {
  const inputText = currentArticle.value.inputText || "";
  const fullText = currentArticle.value.text || "";

  if (index >= inputText.length || index >= fullText.length) {
    return "";
  }

  return inputText[index] === fullText[index]
    ? "correct-letter"
    : "incorrect-letter";
}

watch(
  () => currentArticle.value.inputText,
  (newValue, oldValue) => {
    const target = currentArticle.value.text;
    if (newValue?.length > oldValue?.length) {
      const lastIndex = newValue.length - 1;
      const typedChar = newValue[lastIndex];
      const targetChar = target[lastIndex];
      if (typedChar && typedChar !== targetChar) {
        gameState.value.totalErrors++;
        console.log(`❌ Error detectado! Total errores: ${gameState.value.totalErrors}, Modo: ${gameMode.value}`);
        
        // Agregar mensaje de error a la consola
        addConsoleMessage(`❌ Error detectado! Total: ${gameState.value.totalErrors}`, 'error');
        
        // Si es modo muerte súbita y es el primer error, eliminar al jugador
        if (gameMode.value === 'muerte-subita' && gameState.value.totalErrors === 1) {
          console.log('💀 Activando eliminación por modo Muerte Súbita');
          addConsoleMessage('💀 ¡ELIMINADO! Error en modo Muerte Súbita', 'error');
          handleSuddenDeathElimination();
          return;
        }
        
        // Notificar a toda la sala cada 3 errores
        if (gameState.value.totalErrors % 3 === 0) {
          // Agregar mensaje de error a la consola solo cada 3 errores
          //addConsoleMessage(`❌ Error detectado! Total: ${gameState.value.totalErrors}`, 'error');
          gameStore.manager.emit("playerError", {
            errorCount: gameState.value.totalErrors,
          });
        }
      }

      // Calcular porcentaje del artículo actual basado en caracteres escritos
      const currentPercent = Math.round(
        (newValue.length / target.length) * 100,
      );

      // Emitir progreso en tiempo real para actualizar barras de todos
      // Evitar emitir 100% porque el evento de completar artículo resetea el progreso a 0
      if (currentPercent < 100) {
        gameStore.manager.emit("updateProgress", {
          progress: currentPercent,
        });
      }

      const milestones = [25, 50, 75, 100];

      // Verificar si alcanzamos un nuevo milestone que no hemos notificado
      if (
        milestones.includes(currentPercent) &&
        !notifiedMilestones.value.has(currentPercent)
      ) {
        notifiedMilestones.value.add(currentPercent);
        
        // Agregar mensaje de milestone a la consola
        if (currentPercent === 100) {
          addConsoleMessage(`🎉 ¡Artículo ${gameState.value.currentIndex + 1} completado!`, 'success');
        } else {
          addConsoleMessage(`🎯 ${currentPercent}% del artículo ${gameState.value.currentIndex + 1} completado`, 'milestone');
        }
        
        // Emitir evento al backend para que notifique a toda la sala
        gameStore.manager.emit("playerMilestone", {
          percent: currentPercent,
          articleNumber: gameState.value.currentIndex + 1,
        });
      }
    }
  },
);

function handleSuddenDeathElimination() {
  isEliminated.value = true;
  eliminationReason.value = 'error';
  
  // Detener el temporizador
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  
  // Agregar mensaje a la consola
  addConsoleMessage('💀 Has sido eliminado del juego', 'error');
  
  // Notificar al servidor sobre la eliminación
  gameStore.manager.emit("playerError", {
    errorCount: 1,
    reason: "error"
  });
}

function handleKeyDown(event) {
  const article = currentArticle.value;
  if (!article || article.completed) return;

  if (event.key === "Backspace") {
    article.inputText = article.inputText.slice(0, -1);
  } else if (event.key.length === 1) {
    // Validación para limitar espacios consecutivos
    if (event.key === " ") {
      // Si el último carácter escrito ya es un espacio, no permitir otro
      if (
        article.inputText.length > 0 &&
        article.inputText[article.inputText.length - 1] === " "
      ) {
        event.preventDefault();
        return;
      }
    }

    article.inputText += event.key;
    startTimer();
    handleTextInput();
    activeKeyHighlight.value = event.key.toLowerCase();
  }
}

function handleBack() {
  emit("back");
}

function loadArticles() {
  if (gameStore.manager.callbacks["articlesData"]) {
    delete gameStore.manager.callbacks["articlesData"];
  }

  gameStore.manager.on("articlesData", (articles) => {
    if (articles && articles.length > 0) {
      gameState.value.articles = articles.map((a) => ({
        text: a.text,
        inputText: "",
        completed: false,
      }));
      gameState.value.isLoading = false;
      //Upon loading the articles it will start the countdown
      startCountdown();
    } else {
      gameState.value.isLoading = false;
    }
  });
  gameStore.manager.emit("getArticles", { roomName: gameStore.roomName });
}

gameStore.manager.on("leaderboardUpdateInRoom", handleUserScores);

function handleUserScores(data) {
  console.log("scores have been retireved!", data);
  gameStore.roomScore = data;
}

// Listeners para notificaciones de otros jugadores
gameStore.manager.on("playerMilestone", (data) => {
  if (data.percent === 100) {
    addConsoleMessage(
      `📄 ${data.username} ha completado el artículo ${data.articleNumber}`,
      'success'
    );
  } else {
    addConsoleMessage(
      `🎯 ${data.username} ha alcanzado el ${data.percent}% del artículo ${data.articleNumber}`,
      'milestone'
    );
  }
});

gameStore.manager.on("playerError", (data) => {
  addConsoleMessage(
    `⚠️ ${data.username} lleva ${data.errorCount} errores`,
    'warning'
  );
});

// Escuchar evento de eliminación del servidor
gameStore.manager.on("eliminatedFromGame", (data) => {
  console.log('💀 Servidor confirmó eliminación:', data);
  isEliminated.value = true;
  
  // Agregar mensaje a la consola
  addConsoleMessage('💀 Eliminación confirmada por el servidor', 'error');
  
  // Detener el temporizador
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

// Escuchar cuando otro jugador es eliminado
gameStore.manager.on("playerEliminated", (data) => {
  addConsoleMessage(`💀 ${data.username} ha sido eliminado`, 'error');
});


onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  
  // Debug: Verificar datos de la sala al montar
  console.log('🔍 GameEngine montado');
  console.log('🔍 Sala actual:', gameStore.currentRoom);
  console.log('🔍 Todas las salas:', gameStore.rooms);
  const currentRoom = gameStore.rooms.find(r => r.name === gameStore.currentRoom);
  console.log('🔍 Datos de sala actual:', currentRoom);
  if (currentRoom) {
    gameMode.value = currentRoom.gameMode || 'normal';
    console.log('🎮 Modo de juego inicial:', gameMode.value);
  }
  
  // Mensaje inicial en la consola
  setTimeout(() => {
    addConsoleMessage('🎮 Juego iniciado. ¡Buena suerte!', 'info');
    if (gameMode.value === 'muerte-subita') {
      addConsoleMessage('💀 Modo Muerte Súbita activado - ¡Cuidado con los errores!', 'warning');
    }
  }, 500);
  
  document.addEventListener("keydown", handleKeyDown);
  loadArticles();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
  gameStore.manager.off("articlesData");
  gameStore.manager.off("playerMilestone");
  gameStore.manager.off("playerError");
  //Cleanup after timer is over
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

</script>

<style scoped>
.game-engine-wrapper {
  position: relative;
  min-height: 100vh;
  background: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-engine {
  background: var(--color-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  box-sizing: border-box;
}

.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  align-items: center;
  width: 100%;
}

.game-layout {
  display: flex;
  gap: var(--spacing-xl);
  width: min(1200px, 92vw);
  align-items: flex-start;
  justify-content: center;
  padding: var(--spacing-md);
  box-sizing: border-box;
}

.typing-area {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-lg);
}

.typing-area .card-paper {
  width: 100%;
  padding: var(--spacing-lg);
}

.typing-keyboard {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-left: calc(var(--spacing-md) * 0.5);
  margin-right: auto;
}

.full-text-container {
  flex: 1;
}

.text-display {
  font-size: clamp(1rem, 1.8vw, 1.6rem);
  line-height: 1.5;
  word-wrap: break-word;
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  border: 2px solid var(--color-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-md);
  min-height: 110px;
  max-height: 420px;
  overflow-y: auto;
  color: var(--color-primary);
}

.correct-letter {
  color: var(--text-white);
  background: var(--color-secondary);
}

.incorrect-letter {
  color: var(--text-white);
  background: var(--color-danger);
}

.remaining-text {
  color: var(--text-muted);
}

.loading {
  font-size: 2rem;
  color: var(--color-primary);
  text-align: center;
  font-weight: var(--font-weight-bold);
}

.game-completed {
  text-align: center;
  font-size: 1.4rem;
  color: var(--color-primary);
}

.timer-container {
  background: var(--bg-card);
  color: var(--color-primary);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.timer-container.timer-warning {
  background: color-mix(in srgb, var(--color-danger) 70%, var(--bg-card) 30%);
  color: var(--text-white);
  border-color: var(--color-danger);
  animation: timerPulse 1s infinite;
}

@keyframes timerPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.timer-icon {
  font-size: 2.2rem;
  color: inherit;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: "Courier New", monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: inherit;
}

.timer-minutes,
.timer-seconds {
  min-width: 2ch;
  text-align: center;
}

.timer-separator {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.35;
  }
}

.scoreboard.card-paper,
.user-scoreboard.card-paper {
  padding: var(--spacing-lg);
}

.scoreboard--right {
  margin-left: var(--spacing-xl);
}

.scoreboard {
  width: clamp(220px, 20vw, 250px);
  flex-shrink: 0;
}

.scoreboard-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.player-entry {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  border: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
  padding: var(--spacing-sm) var(--spacing-md);
}

.player-entry.is-leader {
  background: color-mix(in srgb, var(--color-secondary) 65%, var(--bg-card) 35%);
  border-color: color-mix(in srgb, var(--color-secondary) 55%, var(--color-primary) 45%);
  box-shadow: var(--shadow-md);
}

.player-entry.is-leader .player-name,
.player-entry.is-leader .player-count {
  color: var(--text-white);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.you-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: var(--spacing-xs);
}

.is-leader .you-label {
  color: rgba(255, 255, 255, 0.9);
}

.player-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-bar-container {
  background: color-mix(in srgb, var(--bg-hover) 60%, var(--bg-card) 40%);
  border-radius: var(--radius-lg);
  height: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent 80%);
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-secondary);
  transition: width 0.5s ease;
}

.is-leader .progress-bar-fill {
  background: var(--color-warning);
  box-shadow: 0 0 10px rgba(227, 168, 87, 0.5);
}

.empty-scoreboard {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
  font-size: 1rem;
}

.game-money {
  position: absolute;
  right: 7.5vw;
  bottom: 15vh;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-primary);
  color: var(--text-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

.game-money .money-icon {
  font-size: 1.6rem;
}

.game-money .money-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}

.user-scoreboard {
  width: clamp(220px, 20vw, 250px);
  flex-shrink: 0;
  align-self: flex-start;
}

.user-scoreboard-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1.15rem;
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.user-scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.user-scoreboard .player-entry {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
}

.user-scoreboard .player-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.user-scoreboard .player-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.notification-stack {
  position: fixed;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  gap: var(--spacing-sm);
}

@media (max-width: 1024px) {
  .game-layout {
    flex-direction: column;
    align-items: center;
  }

  .user-scoreboard,
  .scoreboard,
  .full-text-container {
    width: min(640px, 95vw);
  }
}

@media (max-width: 768px) {
  .back-button {
    top: var(--spacing-lg);
    left: var(--spacing-lg);
  }

  .text-display {
    font-size: 1.2rem;
    padding: var(--spacing-lg);
  }

  .timer-display {
    font-size: 2rem;
  }
}
</style>
