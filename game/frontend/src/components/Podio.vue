<template>
  <div class="podio-page">
    <div class="panel">
      <h1 class="title">PODIO</h1>

          <div class="podio-grid">
            <div class="podium-left">
              <div class="podium-list">
                <div v-for="(p, idx) in displayedPlayers" :key="p.username || idx" class="podium-row" :class="['rank-' + (idx+1), {first: idx===0}]">
                  <div class="position" :class="{ large: idx===0 }">{{ idx+1 }}</div>
                  <div class="player-name">
                    <div class="name">{{ p.username || '---' }}</div>
                    <div class="small">Tiempo: {{ formatTime(p.time) }} • Errores: {{ p.errors ?? '-' }} • Artículos: {{ p.articlesDone ?? '-' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="podium-right">
              <div class="stat-block">
                <div class="stat-title">Tabla de resultados</div>
                <div class="stat-content">
                  <div class="stat-row header">
                    <div class="label">Jugador</div>
                    <div class="value">Tiempo</div>
                    <div class="value">Errores</div>
                    <div class="value">Artículos</div>
                  </div>
                  <div v-for="(p, i) in displayedPlayers" :key="p.username + '-' + i" class="stat-row">
                    <div class="label">{{ i+1 }}. {{ p.username }}</div>
                    <div class="value">{{ formatTime(p.time) }}</div>
                    <div class="value">{{ p.errors ?? '-' }}</div>
                    <div class="value">{{ p.articlesDone ?? '-' }}</div>
                  </div>
                  <div v-if="displayedPlayers.length===0" class="stat-row">
                    <div class="label">—</div>
                    <div class="value">No hay datos</div>
                  </div>
                </div>
              </div>

              <div class="stat-block">
                <div class="stat-title">Resumen</div>
                <div class="stat-content">
                  <div class="stat-row">
                    <div class="label">Ganador</div>
                    <div class="value">{{ displayedPlayers[0]?.username ?? '-' }}</div>
                  </div>
                  <div class="stat-row">
                    <div class="label">Mejor tiempo</div>
                    <div class="value">{{ formatTime(displayedPlayers[0]?.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

      <div class="actions">
        <button class="play-button" @click="$emit('back')">Volver</button>
        <button class="play-button" @click="$emit('playAgain')">Repetir</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '@/stores/gameStore.js';

const emit = defineEmits(['back','playAgain']);

const gameStore = useGameStore();

// Combinar resultados guardados en BD con el contador de artículos por sala
const displayedPlayers = computed(() => {
  // results (DB) tiene objetos: { username, time, errors }
  // roomScore tiene: { username, articlesDone }
  const byName = {};

  // Priorizar roomScore para articles
  (gameStore.roomScore || []).forEach((r) => {
    if (!r) return;
    byName[r.username] = { username: r.username, articlesDone: r.articlesDone };
  });

  // Mezclar con results
  (gameStore.results || []).forEach((res) => {
    if (!res) return;
    const name = res.username || res.nombre_usuario || res.user || 'unknown';
    if (!byName[name]) byName[name] = { username: name };
    // time in ms
    byName[name].time = res.time ?? res.time_ms ?? res.ms ?? null;
    byName[name].errors = res.errors ?? null;
  });

  // Fall back: si no hay results ni roomScore, intentar usar username local
  if (Object.keys(byName).length === 0 && gameStore.username) {
    byName[gameStore.username] = { username: gameStore.username, articlesDone: 0 };
  }

  // Convertir a array y ordenar por tiempo asc (menor es mejor), luego por articlesDone desc
  const arr = Object.values(byName);
  arr.sort((a, b) => {
    // Si ambos tienen time, ordenar por menor tiempo
    if (a.time != null && b.time != null) return a.time - b.time;
    // Si uno tiene artículos, priorizar por artículos completados
    if ((b.articlesDone || 0) !== (a.articlesDone || 0)) return (b.articlesDone || 0) - (a.articlesDone || 0);
    return 0;
  });
  return arr;
});

function formatTime(ms) {
  if (ms == null || ms === undefined) return '-';
  if (typeof ms !== 'number') return String(ms);
  const seconds = Math.floor(ms / 1000);
  const msRem = ms % 1000;
  return `${seconds}s ${msRem}ms`;
}

// Registrar listeners que actualizan el store ya lo hace el store internamente.
onMounted(() => {
  // no-op: store ya está escuchando eventos en su inicialización
});

onBeforeUnmount(() => {
  // Limpieza opcional
});
</script>

<style scoped>
.podio-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #e6e6e6; /* coincide con App.vue */
}

.panel {
  width: 92%;
  max-width: 1100px;
  background: rgba(255,255,255,0.85);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.title {
  font-size: 2rem;
  text-align: center;
  color: #222020;
  margin-bottom: 1.5rem;
}

.podio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.podium-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.podium-row {
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
}

.podium-row.first { transform: translateY(-12px); }
.podium-row.second { transform: translateY(0); }
.podium-row.third { transform: translateY(0); opacity: 0.95; }
.podium-row.fourth { transform: translateY(0); opacity: 0.9; }

.position.large { width: 96px; height: 96px; font-size: 1.5rem; }
.player-name.large { font-size: 1.25rem; }

.position {
  width: 72px;
  height: 72px;
  background: #6b5bff; 
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.player-name {
  font-weight: 700;
  color: #222020;
}

.podium-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-block {
  background: #c9d0f1; /* suave para bloques */
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.stat-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.45rem 0;
}

.label {
  width: 90px;
  color: #222020;
  font-weight: 600;
}

.bar {
  flex: 1;
  height: 14px;
  background: rgba(0,0,0,0.06);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #6b5bff;
  width: 0%;
  transition: width 400ms ease;
}

.value {
  width: 60px;
  text-align: right;
  font-weight: 700;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  background-color: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.btn:hover { background-color: #f0f0f0; transform: scale(1.03); }

@media (max-width: 800px) {
  .podio-grid { grid-template-columns: 1fr; }
  .podium-row { width: 80%; }
  .panel { padding: 1rem; }
}

</style>
