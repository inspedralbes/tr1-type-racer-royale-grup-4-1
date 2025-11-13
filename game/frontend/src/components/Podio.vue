<template>
  <BaseScreen class="podio-wrapper" @home="$emit('back')" :show-config="false">
    <div class="podio-card card-paper">
      <header class="podio-header">
        <h1 class="podio-title">Podi</h1>
        <p class="podio-subtitle">Classificació final de la ronda</p>
      </header>

      <section class="podio-content">
        <div class="podio-player-highlight pane">
          <div class="podio-highlight-badge">{{ topPlayer.position }}º</div>
          <div class="podio-highlight-info">
            <strong class="podio-highlight-name" :title="topPlayer.username">{{ topPlayer.username }}</strong>
              <div class="podio-highlight-stats">
                <div class="stat">
                  <dt>Articles</dt>
                  <dd>{{ topPlayer.articlesCompleted }}</dd>
                </div>
                <div class="stat">
                  <dt>Errades</dt>
                  <dd>{{ topPlayer.errors }}</dd>
                </div>
                <div class="stat">
                  <dt>Progrés</dt>
                  <dd>{{ topPlayer.progress }}%</dd>
                </div>
              </div>
          </div>
        </div>

        <section class="podio-ranking pane pane--muted">
          <h2 class="ranking-title">Classificació completa</h2>
          <ol class="ranking-list">
            <li
              v-for="player in podiumData.rankings"
              :key="player.username"
              class="ranking-item"
            >
              <span class="ranking-item-name" :title="player.username">
                {{ player.position }}º · {{ player.username }}
              </span>
              <span class="ranking-item-stats">
                {{ player.articlesCompleted }} art. · {{ player.errors }} errades · {{ player.progress }}%
              </span>
            </li>
          </ol>
        </section>
      </section>

      <footer class="podio-actions">
        <button class="btn btn-primary" @click="$emit('back')">Tornar a l'inici</button>
      </footer>
    </div>
  </BaseScreen>
</template>

<script setup>
import { computed } from 'vue';
import BaseScreen from './layout/BaseScreen.vue';

const props = defineProps({
  podiumData: {
    type: Object,
    default: () => ({
      rankings: [],
      winner: '---',
    }),
  },
});

const displayedRankings = computed(() =>
  props.podiumData.rankings.slice(0, 4),
);

const topPlayer = computed(() => props.podiumData.rankings[0] || {
  position: 1,
  username: '---',
  articlesCompleted: 0,
  errors: 0,
  progress: 0,
});
</script>

<style scoped>
.podio-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: var(--color-secondary);
}

.podio-card {
  width: min(720px, 94vw);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.podio-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.podio-title {
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.2rem);
  letter-spacing: 0.1rem;
  text-transform: uppercase;
  color: var(--color-primary);
}

.podio-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.podio-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-lg);
}

.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.podio-player-highlight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  border: 2px solid color-mix(in srgb, var(--color-primary) 35%, transparent 65%);
  background: color-mix(in srgb, var(--bg-card) 80%, var(--color-secondary) 20%);
}

.podio-highlight-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-primary);
  flex: 1;
}

.podio-highlight-badge {
  min-width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: var(--text-white);
  font-weight: var(--font-weight-bold);
  font-size: 1.3rem;
}

.podio-highlight-name {
  font-size: 1.3rem;
  font-weight: 800;
}

.podio-highlight-stats {
  display: flex;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.podio-highlight-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 70px;
  text-align: right;
}

.podio-highlight-stats dt {
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.podio-highlight-stats dd {
  margin: 0;
  font-weight: var(--font-weight-bold);
  font-size: 1.05rem;
  color: var(--color-primary);
}

.ranking-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 1.1rem;
  color: var(--color-primary);
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
  font-size: 0.95rem;
}

.ranking-item:first-of-type {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--text-white);
}

.ranking-item:first-of-type .ranking-item-name,
.ranking-item:first-of-type .ranking-item-stats {
  color: var(--text-white);
}

.ranking-item-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-right: var(--spacing-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-item-stats {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.podio-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}

@media (max-width: 800px) {
  .podio-card {
    padding: var(--spacing-lg);
  }
}
</style>
