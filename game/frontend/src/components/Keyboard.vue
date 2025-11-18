<template>
  <div class="keyboard-grid">
    <div v-for="(row, rowIndex) in keys" :key="rowIndex" class="keyboard-row">
      <button
        v-for="(key, colIndex) in row"
        :key="colIndex"
        :class="['keyboard-key', { 'is-active': key === activeKey }]"
      >
        {{ key }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
const keys = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];
const prop = defineProps({
  activeKey: String,
});

const activeKey = ref("");

watch(
  () => prop.activeKey,
  (newKey) => {
    if (newKey.length != 1) return;
    activeKey.value = newKey.toLowerCase();
    setTimeout(() => {
      activeKey.value = "";
    }, 300);
  },
);
</script>
<style scoped>
.keyboard-grid {
  
  padding-top: 2rem;
}

.keyboard-key {
  text-transform: uppercase;
}

.keyboard-key.is-active {
  pointer-events: none;
}
</style>
