<template>
  <div class="podio-page">
    <div class="panel">
      <h1 class="title">🏆 PODIO 🏆</h1>

      <div class="podio-grid">
        <!-- LEFT: podium positions -->
        <div class="podium-left">
          <div v-for="(player, index) in displayedRankings" :key="index" 
               class="podium-row" 
               :class="getRankClass(index)">
            <div class="position" :class="{ large: index === 0 }">
              {{ player.position }}
            </div>
            <div class="player-info" :class="{ large: index === 0 }">
              <div class="player-name" :title="player.username">{{ player.username }}</div>
              <div class="player-stats-mini">
                <span>📝 {{ player.articlesCompleted }} artículos</span>
                <span>❌ {{ player.errors }} errores</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: statistics / results -->
        <div class="podium-right">
          <div class="stat-block winner-block">
            <div class="stat-title">🎉 Ganador</div>
            <div class="stat-content">
              <div class="winner-info">
                <div class="winner-name" :title="podiumData.winner">{{ podiumData.winner }}</div>
                <div class="prize-money">Premio: {{ podiumData.totalPot }} 💰</div>
              </div>
            </div>
          </div>

          <div class="stat-block">
            <div class="stat-title">Clasificación Completa</div>
            <div class="stat-content">
              <div v-for="player in podiumData.rankings" :key="player.username" class="player-detail">
                <div class="player-detail-header">
                  <span class="rank-badge">{{ player.position }}º</span>
                  <span class="player-detail-name" :title="player.username">{{ player.username }}</span>
                </div>
                <div class="player-detail-stats">
                  <div class="stat-item">
                    <span class="stat-label">Artículos:</span>
                    <span class="stat-value">{{ player.articlesCompleted }}/4</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Errores:</span>
                    <span class="stat-value">{{ player.errors }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Progreso:</span>
                    <span class="stat-value">{{ player.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn" @click="$emit('back')">Volver al Inicio</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  podiumData: { 
    type: Object, 
    default: () => ({ 
      rankings: [],
      totalPot: 0,
      winner: '---'
    }) 
  }
});

// Show top 4 players
const displayedRankings = computed(() => {
  return props.podiumData.rankings.slice(0, 4);
});

function getRankClass(index) {
  const classes = ['first', 'second', 'third', 'fourth'];
  return classes[index] || '';
}
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
.player-info.large .player-name { font-size: 1.4rem; }
.player-info.large .player-stats-mini { font-size: 0.9rem; }

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
  flex-shrink: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 700;
  color: #222020;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.player-stats-mini {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.player-stats-mini span {
  white-space: nowrap;
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

.winner-block {
  background: linear-gradient(135deg, #ffd93d 0%, #ffbe0b 100%);
  border: 2px solid #f59e0b;
}

.stat-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.winner-info {
  text-align: center;
  padding: 0.5rem 0;
}

.winner-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #222020;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  margin-left: auto;
  margin-right: auto;
}

.prize-money {
  font-size: 1.2rem;
  font-weight: 700;
  color: #16a34a;
}

.player-detail {
  background: rgba(255, 255, 255, 0.5);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.player-detail-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rank-badge {
  background: #6b5bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.9rem;
}

.player-detail-name {
  font-weight: 700;
  font-size: 1rem;
  color: #222020;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.player-detail-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #222020;
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background-color: #ffffff;
  color: #000000;
  border: 2px solid #000;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;
  box-shadow: 3px 3px 0 #000;
}

.btn:hover { 
  background-color: #f0f0f0; 
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #000;
}

@media (max-width: 800px) {
  .podio-grid { grid-template-columns: 1fr; }
  .podium-row { width: 80%; }
  .panel { padding: 1rem; }
}

</style>
