<template>
  <div class="keyboard">
    <div v-for="(row, rowIndex) in keys" :key="rowIndex" class="row">
      <button
        v-for="(key, colIndex) in row"
        :key="colIndex"
        :class="key === activeKey ? 'active' : 'key'"
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
.keyboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10vh;
}
.key {
  color: rgba(0, 0, 0, 0.5);
  background-color: #323437;
  border: 1px solid yellow;
  font-size: 2.5em;
  padding: 10px;
  margin-left: 10px;
  margin-bottom: 10px;
  width: 50px;
  border-radius: 10px;
}
.active {
  background-color: yellow;
  color: rgba(0, 0, 0, 0.5);
  border: 1px solid yellow;
  font-size: 2.5em;
  padding: 10px;
  margin-left: 10px;
  margin-bottom: 10px;
  width: 50px;
  border-radius: 10px;
}
</style>
