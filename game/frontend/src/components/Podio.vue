<template>
  <div class="podio-page">
    <div class="card-paper podio-panel">
      <h1 class="podio-title">🏆 Podio 🏆</h1>

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
          <div class="winner-card surface-floating">
            <div class="winner-header">
              <span class="tag tag--warning">🎉 Guanyador</span>
              <p class="winner-subtitle">La redacció celebra el millor reporter de la ronda.</p>
            </div>
            <div class="winner-body">
              <span class="winner-name" :title="podiumData.winner">{{ podiumData.winner }}</span>
              <span class="winner-money">Premi total: {{ podiumData.totalPot }} 💰</span>
            </div>
          </div>

          <div class="ranking-card pane pane--muted">
            <div class="ranking-header">
              <h2>Classificació completa</h2>
              <span class="tag">🗞️ Articles corregits</span>
            </div>

            <div class="ranking-list">
              <article
                v-for="player in podiumData.rankings"
                :key="player.username"
                class="ranking-row surface-floating"
              >
                <header class="ranking-row-header">
                  <span class="rank-badge">{{ player.position }}º</span>
                  <span class="ranking-name" :title="player.username">{{ player.username }}</span>
                </header>
                <dl class="ranking-stats">
                  <div class="stat">
                    <dt>Articles</dt>
                    <dd>{{ player.articlesCompleted }}/4</dd>
                  </div>
                  <div class="stat">
                    <dt>Errors</dt>
                    <dd>{{ player.errors }}</dd>
                  </div>
                  <div class="stat">
                    <dt>Progrés</dt>
                    <dd>{{ player.progress }}%</dd>
                  </div>
                </dl>
              </article>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" @click="$emit('back')">Tornar a l'inici</button>
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
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: color-mix(in srgb, var(--color-secondary) 30%, var(--bg-body) 70%);
}

.podio-panel {
  width: min(1100px, 96vw);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  text-align: left;
}

.podio-title {
  margin: 0;
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.6rem);
  letter-spacing: 0.12rem;
  text-transform: uppercase;
  color: var(--color-primary);
}

.podio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

.podium-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.podium-row {
  width: min(320px, 85%);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--bg-card) 88%, var(--color-secondary) 12%);
  border: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
  box-shadow: var(--shadow-sm);
}

.podium-row.first {
  transform: translateY(-6px);
  background: color-mix(in srgb, var(--bg-card) 80%, var(--color-secondary) 20%);
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent 55%);
  box-shadow: var(--shadow-md);
}

.position {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-secondary);
  color: var(--text-white);
  font-weight: var(--font-weight-bold);
  font-size: 1.4rem;
  box-shadow: var(--shadow-sm);
}

.position.large {
  width: 96px;
  height: 96px;
  font-size: 1.75rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  color: var(--color-primary);
}

.player-info.large .player-name {
  font-size: 1.3rem;
}

.player-name {
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-stats-mini {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.podium-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.winner-card {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.winner-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  color: var(--text-muted);
}

.winner-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.winner-name {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary);
}

.winner-money {
  font-weight: 700;
  color: color-mix(in srgb, var(--color-success) 70%, var(--color-primary) 30%);
}

.ranking-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.ranking-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-primary);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ranking-row {
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ranking-row-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-round);
  background: color-mix(in srgb, var(--color-secondary) 45%, var(--bg-card) 55%);
  color: var(--text-white);
  font-weight: var(--font-weight-bold);
}

.ranking-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-stats {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  margin: 0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 90px;
}

.stat dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: var(--text-muted);
}

.stat dd {
  margin: 0;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 800px) {
  .podium-row {
    width: 100%;
  }

  .winner-card,
  .ranking-card {
    padding: var(--spacing-md);
  }
}
</style>
