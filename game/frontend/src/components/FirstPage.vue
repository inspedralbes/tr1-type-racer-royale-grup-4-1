<template>
  <div class="first-page">
    <Config/>
    <h1 class="title">Jorunalism Race!</h1>
    <button class="play-button" @click="$emit('lobby')">
      Jugar
    </button>
 
  </div>
</template>

<script setup>
import Config from "./Config.vue";
defineEmits(['lobby']);
</script>

<style scoped>
.first-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
  position: relative;
}

.title {
  font-size: 4rem;
  color: #222020;
  margin: 0;
  font-weight: bold;
  
}

.play-button {
  padding: 1rem 3rem;
  font-size: 1.5rem;
  background-color: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}
.config-button {
  padding: 1rem 3rem;
  font-size: 1.5rem;
  background-color: #ffffff;
  color: #302c2c;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  position: absolute;
  bottom: 4vh;
  right: 4vw;
}

.play-button:hover {
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.play-button:active {
  transform: scale(0.98);
}
</style>