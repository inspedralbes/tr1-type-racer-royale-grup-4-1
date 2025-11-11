<template>
  <div class="money-container">
    <div class="money-icon">💰</div>
    <div class="money-amount">{{ formattedMoney }} $</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useGameStore } from '@/stores/gameStore.js';

const store = useGameStore();

const formattedMoney = computed(() => {
  return store.money.toLocaleString();
});

onMounted(() => {
  // Fetch user money when component is mounted
  if (store.userId) {
    store.fetchUserMoney();
  }
});
</script>

<style scoped>
.money-container {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  padding: 15px 25px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 3px solid #f0c000;
  z-index: 1000;
  transition: all 0.3s ease;
}

.money-container:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.money-icon {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.money-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}
</style>
