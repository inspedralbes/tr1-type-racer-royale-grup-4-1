<template>
  <div class="money-container">
    <div class="money-icon"><i class="fa-solid fa-coins"></i></div>
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
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
  border: 3px solid var(--color-primary);
  color: var(--text-white);
  z-index: 1000;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.money-container:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.money-icon {
  font-size: 1.75rem;
}

.money-amount {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}
</style>
