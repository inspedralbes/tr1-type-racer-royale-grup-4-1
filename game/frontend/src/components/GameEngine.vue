<template>
  <div class="game-engine">
    <button class="back-button" aria-label="Volver" @click="handleBack">
      <i class="fa-solid fa-house"></i>
    </button>
    <div class="container">
      <div v-if="gameState.isLoading" class="loading">
        <p>Cargando texto...</p>
      </div>
      <template v-else>
        <div class="full-text-container">
          <div class="text-display">
            <span
              v-for="(letter, i) in gameState.inputText"
              :key="'input-' + i"
              :class="getLetterClass(i)"
            >
              {{ letter }}
            </span>
            <span class="remaining-text">{{ remainingText }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useGameStore } from '../stores/gameStore';

const emit = defineEmits(["activeKey", "back"]);
const gameStore = useGameStore();

const gameState = ref({
  fullText: "",
  inputText: "",
  stats: [],
  totalErrors: 0,
  isLoading: true,
});

const remainingText = computed(() => {
  if (!gameState.value.fullText) return "";
  const typedLength = gameState.value.inputText.length;
  return gameState.value.fullText.substring(typedLength);
});

let textStartTime = 0;

function startTimer() {
  if (textStartTime === 0) {
    textStartTime = Date.now();
  }
}

function handleTextInput() {
  if (gameState.value.inputText === gameState.value.fullText) {
    const timeTaken = Date.now() - textStartTime;
    stopGame(timeTaken);
  }
}

function stopGame(timeTaken) {
  const userResults = {
    username: gameStore.username,
    time: timeTaken,
    errors: gameState.value.totalErrors
  };
  
  console.log('Resultados del usuario:', userResults);
  
  // Enviar resultados al servidor
  gameStore.manager.emit('userResults', userResults);
}

function getLetterClass(index) {
  const inputText = gameState.value.inputText;
  const fullText = gameState.value.fullText;
  
  if (index >= inputText.length || index >= fullText.length) {
    return "";
  }
  
  if (inputText[index] === fullText[index]) {
    return "correct-letter";
  }
  return "incorrect-letter";
}
// Watches for the input of the user
watch(
  () => gameState.value.inputText,
  (newValue, oldValue) => {
    const target = gameState.value.fullText;
    if (newValue.length > oldValue.length) {
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
  if (event.key === "Backspace") {
    gameState.value.inputText = gameState.value.inputText.slice(0, -1);
  } else if (event.key.length === 1) {
    gameState.value.inputText += event.key;
    startTimer();
    handleTextInput();
    emit("activeKey", event.key);
  }
}

function handleBack() {
  emit('back');
}

function loadArticles() {
  if (gameStore.manager.callbacks['articlesData']) {
    delete gameStore.manager.callbacks['articlesData'];
  }
  
  gameStore.manager.on('articlesData', (articles) => {
    if (articles && articles.length > 0) {
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      gameState.value.fullText = randomArticle.text;
      gameState.value.isLoading = false;
    } else {
      gameState.value.isLoading = false;
    }
  });
  
  gameStore.manager.emit('getArticles', { roomName: gameStore.currentRoom });
}

// Lifecycle hooks for adding/removing global event listener
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  loadArticles();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
  delete gameStore.manager.callbacks['articlesData'];
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

.back-button i {
  font-size: 1.25rem;
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem 0;
  margin-top: 5vh;
  position: relative;
  font-family: sans-serif;
  min-height: 60vh;
}

.full-text-container {
  position: relative;
  width: 90%;
  max-width: 900px;
}

.text-display {
  font-size: 2em;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
  background-color: #f9f9f9;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  border: 2px solid #d0d0d0;
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
}

.correct-letter {
  color: white;
  background-color: #4CAF50;
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
}

.loading p {
  margin: 0;
  font-weight: 600;
}
</style>
