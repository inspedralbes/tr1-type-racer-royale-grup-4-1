<template>
  <GameEngine v-if="startGame" @activeKey="handleActiveKey" />
  <Keyboard v-if="startGame" :activeKey="currActiveKey" />
  <MainMenu v-else />
</template>
<script setup>
import { ref, provide } from "vue";
import GameEngine from "./components/GameEngine.vue";
import MainMenu from "./components/MainMenu.vue";
import Keyboard from "./components/Keyboard.vue";
import SocketManager from "../services/socketManager";

const manager = new SocketManager();
const startGame = ref(false);
const currActiveKey = ref("");
manager.connect();

provide("socketManager", manager);

manager.on("gameStart", handleGameStart);
function handleGameStart() {
  startGame.value = true;
}

function handleActiveKey(key) {
  currActiveKey.value = "";
  requestAnimationFrame(() => {
    //Forces vue to detect same key twice
    currActiveKey.value = key;
  });
}
</script>
<style>
body {
  background-color: #323437;
  font-size: sans-serif;
}
</style>
