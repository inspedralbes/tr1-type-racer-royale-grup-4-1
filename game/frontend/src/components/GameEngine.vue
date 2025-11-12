<template>
  <div class="game-engine">
    <button class="btn-icon back-button" aria-label="Volver" @click="handleBack">
      <i class="fa-solid fa-house"></i>
    </button>

    <div class="container">
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
          </div>
          <!-- Text Display Section -->
          <div v-if="!allCompleted" class="full-text-container">
            <div class="text-display card-paper">
            <span
                v-for="(letter, i) in currentArticle.inputText"
              :key="'input-' + i"
              :class="getLetterClass(i)"
            >
              {{ letter }}
            </span>
            <span class="remaining-text">{{ remainingText }}</span>
            </div>
          </div>

          <div v-else class="game-completed">
            <h2>¡Todos los artículos completados!</h2>
            <p>
              Excelente trabajo, periodista. Has terminado todas las sesiones.
            </p>
          </div>

          <!-- Scoreboard Section -->
          <div class="scoreboard card-paper">
            <h3 class="scoreboard-title">Room progress</h3>
            <div class="scoreboard-content">
              <div
                v-for="(score, index) in sortedScores"
                :key="score.id || index"
                class="player-entry"
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
    <!-- Notificaciones pop-up -->
    <div class="notification-stack">
      <GameNotification
        v-for="(notif, i) in notifications"
        :key="notif.id"
        :message="notif.message"
        :duration="notif.duration"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useGameStore } from "../stores/gameStore";
import GameNotification from "./GameNotification.vue";

const emit = defineEmits(["activeKey", "back"]);
const gameStore = useGameStore();

// Notificaciones pop-up
const notifications = ref([]);
let notifId = 0;
function pushNotification(message, duration = 3500) {
  const id = notifId++;
  notifications.value.push({ id, message, duration });
  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }, duration + 500);
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

// Timer state
const timeRemaining = ref(120); // 120 seconds (2 minutes)
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
    } else {
      clearInterval(timerInterval.value);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  console.log("Time's up!");
  
  // Send final results to server
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

  // Track errors as before
  const target = article.text;
  const newValue = article.inputText;
  const oldValue = newValue.slice(0, -1);

  if (newValue.length > oldValue.length) {
    const lastIndex = newValue.length - 1;
    const typedChar = newValue[lastIndex];
    const targetChar = target[lastIndex];
    if (typedChar && typedChar !== targetChar) {
      gameState.value.totalErrors++;
      if (gameState.value.totalErrors % 3 === 0) {
        gameStore.manager.emit("playerError", {
          errorCount: gameState.value.totalErrors,
        });
      }
    }

    const currentPercent = Math.round((newValue.length / target.length) * 100);

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
        // Notificar a toda la sala cada 3 errores
        if (gameState.value.totalErrors % 3 === 0) {
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
        // Emitir evento al backend para que notifique a toda la sala
        gameStore.manager.emit("playerMilestone", {
          percent: currentPercent,
          articleNumber: gameState.value.currentIndex + 1,
        });
      }
    }
  },
);

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
    emit("activeKey", event.key);
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
  
  gameStore.manager.emit("getArticles");
}

gameStore.manager.on("leaderboardUpdateInRoom", handleUserScores);

function handleUserScores(data) {
  console.log("scores have been retireved!", data);
  gameStore.roomScore = data;
}

// Listeners para notificaciones de otros jugadores
gameStore.manager.on("playerMilestone", (data) => {
  if (data.percent === 100) {
    pushNotification(
      `� ${data.username} ha completado el artículo ${data.articleNumber}`,
      4500,
    );
  } else {
    pushNotification(
      `�🎯 ${data.username} ha alcanzado el ${data.percent}% del artículo ${data.articleNumber}`,
      4000,
    );
  }
});

gameStore.manager.on("playerError", (data) => {
  pushNotification(
    `⚠️ ${data.username} lleva ${data.errorCount} errores`,
    3000,
  );
});

onMounted(() => {
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
.game-engine {
  position: relative;
  min-height: 100vh;
  background: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
}

.back-button {
  position: absolute;
  top: var(--spacing-xl);
  left: var(--spacing-xl);
  z-index: 10;
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-xl);
  width: 100%;
}

.game-layout {
  display: flex;
  gap: 2rem;
  width: 90%;
  max-width: 1400px;
  align-items: flex-start;
  justify-content: center;
  margin: 0 auto;
}

.full-text-container {
  width: 900px;
  max-width: 900px;
  min-width: 0;
}

.text-display {
  font-size: 2rem;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-xl);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
  background: var(--bg-card);
  min-height: 120px;
  max-height: 500px;
  overflow-y: auto;
}

.correct-letter {
  color: var(--text-white);
  background-color: var(--color-secondary);
}

.incorrect-letter {
  color: var(--text-white);
  background-color: var(--color-danger);
}

.remaining-text {
  color: var(--text-muted);
}

.loading {
  font-size: 2em;
  color: var(--color-primary);
  text-align: center;
  font-weight: 600;
}

.game-completed {
  width: 900px;
  max-width: 900px;
  text-align: center;
  font-size: 1.5rem;
  color: var(--color-primary);
  border: 3px solid var(--color-primary);
  padding: var(--spacing-xl);
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
}
/* Timer Styles */
.timer-container {
  background: var(--bg-card);
  color: var(--color-primary);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.timer-container.timer-warning {
  background: color-mix(in srgb, var(--color-danger) 75%, var(--bg-card) 25%);
  color: var(--text-white);
  border-color: var(--color-danger);
  animation: pulse 1s infinite;
}

@keyframes pulse {
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
    opacity: 0.3;
  }
}
/* Scoreboard Styles */
.scoreboard {
  width: 250px;
  padding: var(--spacing-lg);
}

.scoreboard-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.75rem;
}

.scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.player-entry {
  background: var(--bg-page);
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, var(--bg-body) 70%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.player-entry.is-leader {
  background: color-mix(in srgb, var(--color-secondary) 60%, var(--bg-card) 40%);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.player-entry.is-leader .player-name,
.player-entry.is-leader .player-count {
  color: var(--text-white);
  font-weight: 700;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.player-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.you-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 0.5rem;
}

.is-leader .you-label {
  color: rgba(255, 255, 255, 0.85);
}

.player-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.progress-bar-container {
  background: color-mix(in srgb, var(--bg-card) 70%, var(--bg-hover) 30%);
  border-radius: var(--radius-lg);
  height: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--bg-body) 70%);
}

.progress-bar-fill {
  height: 100%;
  background: color-mix(in srgb, var(--color-secondary) 80%, var(--color-primary) 20%);
  border-radius: var(--radius-lg);
  transition: width 0.5s ease;
  position: relative;
}

.is-leader .progress-bar-fill {
  background: color-mix(in srgb, var(--color-primary) 65%, var(--text-white) 35%);
  box-shadow: 0 0 10px rgba(91, 63, 27, 0.35);
}

.empty-scoreboard {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.empty-scoreboard p {
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .game-layout {
    flex-direction: column;
    align-items: center;
  }

  .scoreboard {
    width: 100%;
    max-width: 600px;
  }
}

/* User Scoreboard (Left side) */
.user-scoreboard {
  width: 250px;
  padding: var(--spacing-lg);
  flex-shrink: 0;
  align-self: flex-start;
}

.user-scoreboard-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.5rem;
}

.user-scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.user-scoreboard .player-entry {
  background: var(--bg-page);
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, var(--bg-body) 70%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.user-scoreboard .player-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.user-scoreboard .player-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
}

@media (max-width: 1024px) {
  .user-scoreboard {
    width: 100%;
    max-width: 600px;
  }
}

/* Notification stack */
.notification-stack {
  position: fixed;
  top: 32px;
  right: 32px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
</style>
