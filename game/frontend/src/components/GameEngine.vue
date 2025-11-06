<template>
  <div class="game-engine">
    <button class="back-button" aria-label="Volver" @click="handleBack">
      <i class="fa-solid fa-house"></i>
    </button>

    <div class="container">
      <div v-if="gameState.isLoading" class="loading">
        <p>Cargando artículos...</p>
      </div>

      <template v-else>
        <div class="game-layout">
          <!-- User Scoreboard (Left side) -->
          <div class="user-scoreboard">
            <h3 class="user-scoreboard-title">Tu Progreso</h3>
            <div class="user-scoreboard-content">
              <div class="player-entry current-user">
                <div class="player-header">
                  <span class="player-name">{{ gameStore.username }}</span>
                  <span class="player-count"
                    >{{ userScore.articlesDone }}/{{ totalArticles }}</span
                  >
                </div>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width:
                        getProgressPercentage(userScore.articlesDone) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Text Display Section -->
          <div v-if="!allCompleted" class="full-text-container">
            <div class="text-display">
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
          <div class="scoreboard">
            <h3 class="scoreboard-title">Room progress</h3>
            <div class="scoreboard-content">
              <div
                v-for="(score, index) in sortedScores"
                :key="score.id || index"
                class="player-entry"
                :class="{ 'is-leader': index === 0 && score.articlesDone > 0 }"
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
                    >{{ score.articlesDone }}/{{ totalArticles }}</span
                  >
                </div>

                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width: getProgressPercentage(score.articlesDone) + '%',
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useGameStore } from "../stores/gameStore";

const emit = defineEmits(["activeKey", "back"]);
const gameStore = useGameStore();

const userScores = computed(() => gameStore.roomScore);

const gameState = ref({
  articles: [],
  currentIndex: 0,
  totalErrors: 0,
  isLoading: true,
  completedArticles: 0,
});

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
  return [...userScores.value].sort((a, b) => b.articlesDone - a.articlesDone);
});

const userScore = computed(() => {
  return (
    userScores.value.find((s) => s.username === gameStore.username) || {
      username: gameStore.username,
      articlesDone: 0,
    }
  );
});

function getProgressPercentage(articlesDone) {
  if (totalArticles.value === 0) return 0;
  return Math.min((articlesDone / totalArticles.value) * 100, 100);
}

let textStartTime = 0;

function startTimer() {
  if (textStartTime === 0) {
    textStartTime = Date.now();
  }
}

function handleTextInput() {
  if (currentArticle.value.inputText === currentArticle.value.text) {
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
    } else {
      gameState.value.isLoading = false;
    }
  });

  gameStore.manager.emit("getArticles");
}

gameStore.manager.on("leaderboardUpdateInRoom", handleUserScores);

function handleUserScores(data) {
  gameStore.roomScore = data;
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  loadArticles();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
  delete gameStore.manager.callbacks["articlesData"];
});
</script>

<style scoped>
.game-engine {
  position: relative;
  min-height: 100vh;
}

.back-button {
  position: absolute;
  left: 5vw;
  bottom: 50vh;
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
  z-index: 10;
}

.back-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem 0;
  margin-top: 5vh;
  position: relative;
  font-family: "Playfair Display", serif;
  min-height: 60vh;
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
  font-size: 2em;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
  background-color: #f9f9f9;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 #000;
  min-height: 120px;
  max-height: 500px;
  overflow-y: auto;
}

.correct-letter {
  color: white;
  background-color: #4caf50;
}

.incorrect-letter {
  color: white;
  background-color: #f44336;
}

.remaining-text {
  color: rgba(0, 0, 0, 0.4);
}

.loading {
  font-size: 2em;
  color: #222020;
  text-align: center;
  font-weight: 600;
}

.game-completed {
  width: 900px;
  max-width: 900px;
  text-align: center;
  font-size: 1.5rem;
  color: #222;
  border: 3px solid #000;
  padding: 2rem;
  background: #fffef8;
  box-shadow: 6px 6px 0 #000;
}

/* Scoreboard Styles */
.scoreboard {
  width: 250px;
  background: #ffffff;
  border: 2px solid #000;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #000;
  padding: 1.5rem;
}

.scoreboard-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: #222;
  border-bottom: 2px solid #000;
  padding-bottom: 0.75rem;
}

.scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-entry {
  background: #f9f9f9;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.player-entry.is-leader {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-color: #c92a2a;
  box-shadow: 0 4px 12px rgba(201, 42, 42, 0.3);
}

.player-entry.is-leader .player-name,
.player-entry.is-leader .player-count {
  color: white;
  font-weight: 700;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #222;
}

.you-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
  margin-left: 0.5rem;
}

.is-leader .you-label {
  color: rgba(255, 255, 255, 0.9);
}

.player-count {
  font-size: 1rem;
  font-weight: 600;
  color: #555;
}

.progress-bar-container {
  background: #e0e0e0;
  border-radius: 8px;
  height: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid #ccc;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
  border-radius: 8px;
  transition: width 0.5s ease;
  position: relative;
}

.is-leader .progress-bar-fill {
  background: linear-gradient(90deg, #ffd93d 0%, #ffbe0b 100%);
  box-shadow: 0 0 10px rgba(255, 190, 11, 0.5);
}

.empty-scoreboard {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
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
  background: #ffffff;
  border: 2px solid #000;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #000;
  padding: 1rem;
  flex-shrink: 0;
  align-self: flex-start;
}

.user-scoreboard-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: #222;
  border-bottom: 2px solid #000;
  padding-bottom: 0.5rem;
}

.user-scoreboard-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-scoreboard .player-entry {
  background: #f9f9f9;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
}

.user-scoreboard .player-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.user-scoreboard .player-count {
  font-size: 1rem;
  font-weight: 600;
  color: #555;
}

@media (max-width: 1024px) {
  .user-scoreboard {
    width: 100%;
    max-width: 600px;
  }
}
</style>
