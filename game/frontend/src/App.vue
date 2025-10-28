<template>
  <FirstPage v-if="!showMainMenu && !startGame" @play="showMainMenu = true" />
  <MainMenu v-else-if="showMainMenu && !startGame" />
  <GameEngine v-if="startGame" @activeKey="handleActiveKey" />
  <Keyboard v-if="startGame" :activeKey="currActiveKey" />
</template>

<script setup>
import { ref, provide } from "vue";
import FirstPage from "./components/FirstPage.vue";
import GameEngine from "./components/GameEngine.vue";
import MainMenu from "./components/MainMenu.vue";
import Keyboard from "./components/Keyboard.vue";
import SocketManager from "../services/socketManager";

const manager = new SocketManager();
const startGame = ref(false);
const showMainMenu = ref(false);
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
    currActiveKey.value = key;
  });
}
</script>

<style>
body {
  background-color: #323437;
  font-family: sans-serif;
  margin: 0;
  padding: 0;
}
</style>