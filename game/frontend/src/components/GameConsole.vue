<template>
  <div class="game-console">
    <div class="console-header">
      <div class="console-title">
        <i class="fa-solid fa-terminal"></i>
        <span>Game Console</span>
      </div>
      <div class="console-controls">
        <button @click="gameStore.playClickSound(); clearConsole()" class="clear-btn" title="Limpiar consola">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    
    <div class="console-body" ref="consoleBody">
      <div 
        v-for="(message, index) in messages" 
        :key="message.id"
        class="console-message"
        :class="message.type"
      >
        <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
        <span class="message-content">{{ message.content }}</span>
      </div>
      
      <div v-if="messages.length === 0" class="console-empty">
        <span class="prompt">></span> Esperando eventos del juego...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

const props = defineProps({
  maxMessages: {
    type: Number,
    default: 50
  }
});

const messages = ref([]);
const consoleBody = ref(null);
let messageId = 0;

const addMessage = (content, type = 'info') => {
  const message = {
    id: messageId++,
    content,
    type,
    timestamp: new Date()
  };
  
  messages.value.push(message);
  
  // Limitar el número de mensajes
  if (messages.value.length > props.maxMessages) {
    messages.value.shift();
  }
  
  // Auto-scroll hacia abajo
  nextTick(() => {
    if (consoleBody.value) {
      consoleBody.value.scrollTop = consoleBody.value.scrollHeight;
    }
  });
};

const clearConsole = () => {
  messages.value = [];
};

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString('es-ES', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Exponer métodos para el componente padre
defineExpose({
  addMessage,
  clearConsole
});
</script>

<style scoped>
.game-console {
  width: 100%;
  background: var(--console-bg);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 3px solid var(--color-primary);
  font-family: 'Onest', sans-serif;
  margin-top: var(--spacing-md);
}

.console-header {
  background: var(--color-primary);
  color: var(--text-white);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.console-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.08rem;
}

.console-title i {
  font-size: 1rem;
}

.console-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.clear-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: var(--text-white);
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  transition: all var(--transition-base);
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.6);
}

.console-body {
  background: var(--console-body-bg);
  color: var(--console-text);
  padding: var(--spacing-md);
  height: 200px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) color-mix(in srgb, var(--bg-card) 85%, transparent 15%);
}

.console-body::-webkit-scrollbar {
  width: 8px;
}

.console-body::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--bg-card) 85%, transparent 15%);
}

.console-body::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 4px;
}

.console-body::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-primary) 80%, white 20%);
}

.console-message {
  display: flex;
  margin-bottom: 0.3rem;
  padding: 0.2rem 0;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timestamp {
  color: var(--console-muted);
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
  min-width: 70px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

.message-content {
  flex: 1;
  word-wrap: break-word;
}

/* Tipos de mensajes */
.console-message.info .message-content {
  color: var(--console-info);
}

.console-message.warning .message-content {
  color: var(--console-warning);
}

.console-message.error .message-content {
  color: var(--console-error);
}

.console-message.success .message-content {
  color: var(--console-success);
}

.console-message.milestone .message-content {
  color: var(--console-milestone);
}

.console-empty {
  color: var(--console-muted);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.prompt {
  color: var(--color-primary);
  font-weight: bold;
}

/* Efectos especiales */
.console-message.error {
  animation: errorPulse 0.5s ease-in;
}

@keyframes errorPulse {
  0% { background: transparent; }
  50% { background: color-mix(in srgb, var(--color-danger) 15%, transparent 85%); }
  100% { background: transparent; }
}

.console-message.milestone {
  animation: milestonePulse 0.8s ease-in;
}

@keyframes milestonePulse {
  0% { background: transparent; }
  50% { background: color-mix(in srgb, var(--color-secondary) 20%, transparent 80%); }
  100% { background: transparent; }
}
</style>
