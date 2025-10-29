<template>
	<div class="host-create-lobby">
			<div class="panel">
				<h2 class="heading">CREAR SALA</h2>

				<div class="content">
					<input class="input" v-model="roomName" placeholder="Nombre de la sala" />

					<select class="input" v-model="mode">
						<option value="normal">Normal</option>
						<option value="timed">Contrarreloj</option>
					</select>
				</div>

				<div class="actions">
					<button class="play-button" @click="goBack">ATRAS</button>
					<button class="play-button" @click="createRoom">CREAR</button>
				</div>
			</div>
	</div>
</template>

<script setup>
import { ref, inject } from "vue";

const emit = defineEmits(["backToLobby", "roomCreated"]);
const manager = inject("socketManager");

const roomName = ref("");
const mode = ref("normal");

function goBack() {
  emit("backToLobby");
}

function createRoom() {
  const name = roomName.value.trim();
  if (!name) {
    alert("Por favor introduce un nombre de sala válido.");
    return;
  }

  if (manager && typeof manager.emit === "function") {
    manager.emit("createRoom", { name, mode: mode.value });
  }

  emit("roomCreated", name);
}
</script>

<style scoped>

.host-create-lobby {
	width: 100vw;
	height: 100vh;
	background-color: #323437; 
}

.panel {
	width: 100%;
	height: 100%;
	background-color: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	color: #ffffff;
}

.heading {
	margin-top: 2.5rem;
	font-weight: 700;
	font-size: 2.5rem;
	color: #ffffff;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 5vh;
	gap: 1rem;
}

.input {
	width: 260px;
	padding: 0.6rem 0.8rem;
	border: none;
	border-radius: 6px;
	background-color: rgba(0,0,0,0.15);
	color: #ffffff;
	font-weight: 700;
}

.actions {
	position: absolute;
	left: 2.5rem;
	right: 2.5rem;
	bottom: 3.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
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

.play-button:hover { background-color: #45a049; transform: scale(1.05); }
.play-button:active { transform: scale(0.98); }

@media (max-width: 600px) {
	.input { width: 200px; }
	.play-button { padding: 0.8rem 1.6rem; font-size: 1rem }
}

</style>
