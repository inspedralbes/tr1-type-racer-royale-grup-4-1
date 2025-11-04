<template>
  <div class="podio-page">
    <div class="panel">
      <h1 class="title">PODIO</h1>

      <div class="podio-grid">
        <!-- LEFT: podium positions -->
        <div class="podium-left">
          <!-- Mostrar en orden: 1 arriba, luego 2, 3, 4 -->
          <div class="podium-row first">
            <div class="position large">1</div>
            <div class="player-name large">{{ winners[0] }}</div>
          </div>

          <div class="podium-row second">
            <div class="position">2</div>
            <div class="player-name">{{ winners[1] }}</div>
          </div>

          <div class="podium-row third">
            <div class="position">3</div>
            <div class="player-name">{{ winners[2] }}</div>
          </div>

          <div class="podium-row fourth">
            <div class="position">4</div>
            <div class="player-name">{{ winners[3] }}</div>
          </div>
        </div>

        <!-- RIGHT: statistics / results placeholder -->
        <div class="podium-right">
          <div class="stat-block">
            <div class="stat-title">Resultado general</div>
            <div class="stat-content"> <!-- Placeholder: reemplazar con datos reales -->
              <div class="stat-row">
                <div class="label">Ganador</div>
                <div class="value">{{ winners[0] }}</div>
              </div>
              <div class="stat-row">
                <div class="label">Puntuación</div>
                <div class="value">{{ stats.score ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="stat-block">
            <div class="stat-title">Estadísticas</div>
            <div class="stat-content">
              <div class="stat-row">
                <div class="label">Precisión</div>
                <div class="bar"><div class="bar-fill" :style="{ width: (stats.accuracy || 0) + '%' }"></div></div>
                <div class="value">{{ stats.accuracy ?? 0 }}%</div>
              </div>
              <div class="stat-row">
                <div class="label">Tiempo</div>
                <div class="bar"><div class="bar-fill" :style="{ width: (stats.timePercent || 0) + '%' }"></div></div>
                <div class="value">{{ stats.time ?? '-' }}</div>
              </div>
              <div class="stat-row">
                <div class="label">Otras</div>
                <div class="bar"><div class="bar-fill" :style="{ width: (stats.otherPercent || 0) + '%' }"></div></div>
                <div class="value">{{ stats.other ?? '-' }}</div>
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

const props = defineProps({
  // Array esperado: [first, second, third, fourth]
  winners: { type: Array, default: () => ["---", "---", "---", "---"] },
  // Estadísticas placeholder, estructura libre por ahora
  stats: { type: Object, default: () => ({ score: '-', accuracy: 0, time: '-', timePercent: 0, other: '-', otherPercent: 0 }) }
})
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
