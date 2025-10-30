<template>
  <div class="game-engine">
    <div class="container">
      <div class="active-word">
        <span v-for="(letter, i) in activeWord.text" :key="i">
          {{ letter }}
        </span>
      </div>
      <div class="input-word">
        <span
          v-for="(letter, i) in gameState.inputText"
          :key="i"
          :class="getLetterClass(i)"
        >
          {{ letter }}
        </span>
      </div>
      <ul class="word-list">
        <li v-for="(word, i) in visibleWordsReversed" :key="i">
          {{ word.text }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["activeKey"]);
const gameState = ref({
  words: [
    { id: 1, text: "component", completed: false },
    { id: 2, text: "reactivitat", completed: false },
    { id: 3, text: "javascript", completed: false },
    { id: 4, text: "framework", completed: false },
    { id: 5, text: "template", completed: false },
  ],
  activeWordIndex: 0,
  inputText: "",
  stats: [],
  totalErrors: 0,
  currentErrors: 0,
});

const activeWord = computed(() => {
  return gameState.value.words[gameState.value.activeWordIndex];
});

const visibleWordsReversed = computed(() => {
  return gameState.value.words
    .filter((word) => word.text !== activeWord.value.text && !word.completed)
    .slice() // make a shallow copy
    .reverse(); // reverse the order
});

let wordStartTime = 0;

function startWordTimer() {
  wordStartTime = Date.now();
}

function handleWordInput() {
  if (gameState.value.inputText.length === 1 && wordStartTime === 0) {
    startWordTimer();
  }

  if (gameState.value.inputText === activeWord.value.text) {
    const timeTaken = Date.now() - wordStartTime;

    gameState.value.stats.push({
      word: activeWord.value.text,
      time: timeTaken,
      errors: gameState.value.currentErrors,
    });

    gameState.value.currentErrors = 0;
    gameState.value.totalErrors = 0;
    activeWord.value.completed = true;
    gameState.value.activeWordIndex++;
    gameState.value.inputText = "";
    wordStartTime = 0;

    if (gameState.value.activeWordIndex >= gameState.value.words.length) {
      stopGame();
    }
  }
}

function stopGame() {
  console.log(gameState.value.stats);
}

function getLetterClass(index) {
  const inputText = gameState.value.inputText;
  if (index >= inputText.length) {
    return "";
  }
  if (inputText[index] === activeWord.value.text[index]) {
    return "correct-letter";
  }
  return "incorrect-letter";
}
//Watches for the input of the user
watch(
  () => gameState.value.inputText,
  (newValue, oldValue) => {
    const target = activeWord.value.text;
    if (newValue.length > oldValue.length) {
      const lastIndex = newValue.length - 1;
      const typedChar = newValue[lastIndex];
      const targetChar = target[lastIndex];
      if (typedChar && typedChar !== targetChar) {
        gameState.value.totalErrors++; // Track mistakes
        gameState.value.currentErrors = gameState.value.totalErrors; // Update currentErrors for stats
      }
    }
  },
);
function handleKeyDown(event) {
  if (event.key === "Backspace") {
    gameState.value.inputText = gameState.value.inputText.slice(0, -1);
  } else if (event.key.length === 1) {
    gameState.value.inputText += event.key;
    handleWordInput();
    emit("activeKey", event.key);
  }
}

// Lifecycle hooks for adding/removing global event listener
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-top: 45vh;
  position: relative;
  font-family: sans-serif;
  min-height: 50vh;
}
.word-list {
  position: absolute;
  font-size: 2.5em;
  color: #222020;
  list-style: none;
  width: 225px;
  bottom: 5vh;
  margin: 0;
  padding: 0;
}

.word-list > li {
  margin: 10px 0;
}
.active-word {
  position: absolute;
  font-size: 3em;
  color: rgba(0, 0, 0, 0.3);
  padding: 10px 35px;
  z-index: 1;
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  width: 225px;
  background-color: #f9f9f9;
}

.input-word {
  width: 225px;
  height: 75px;
  font-size: 3em;
  padding: 10px 35px;
  z-index: 2;
}

.correct-letter {
  color: white;
}

.incorrect-letter {
  color: red;
}
</style>
