<template>
  <div class="first-page">
    <h1 class="title">Type Racer</h1>
    <button class="play-button" @click="$emit('play')">
      Jugar
    </button>
  </div>
</template>

<script setup>
defineEmits(['play']);
</script>

<style scoped>
.first-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 3rem;
}

.title {
  font-size: 4rem;
  color: #ffffff;
  margin: 0;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.play-button {
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

.play-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}

.play-button:active {
  transform: scale(0.98);
}
</style>