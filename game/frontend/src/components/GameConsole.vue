<template>
  <div class="game-console">
    <div class="console-header">
      <div class="console-title">
        <i class="fa-solid fa-terminal"></i>
        <span>Game Console</span>
      </div>
      <div class="console-controls">
        <button @click="clearConsole" class="clear-btn" title="Limpiar consola">
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
  background: #1a1a1a;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  font-family: 'Courier New', monospace;
  box-shadow: var(--shadow-md);
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
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--text-white);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition-base);
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.console-body {
  background: #1a1a1a;
  color: #00ff00;
  padding: var(--spacing-md);
  height: 200px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.4;
}

.console-body::-webkit-scrollbar {
  width: 8px;
}

.console-body::-webkit-scrollbar-track {
  background: #2a2a2a;
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
  margin-bottom: 0.25rem;
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
  color: #888;
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
  min-width: 70px;
}

.message-content {
  flex: 1;
  word-wrap: break-word;
}

/* Tipos de mensajes */
.console-message.info .message-content {
  color: #00ff00;
}

.console-message.warning .message-content {
  color: #ffaa00;
}

.console-message.error .message-content {
  color: #ff4444;
}

.console-message.success .message-content {
  color: #44ff44;
}

.console-message.milestone .message-content {
  color: #00aaff;
}

.console-empty {
  color: #666;
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
  50% { background: rgba(255, 68, 68, 0.1); }
  100% { background: transparent; }
}

.console-message.milestone {
  animation: milestonePulse 0.8s ease-in;
}

@keyframes milestonePulse {
  0% { background: transparent; }
  50% { background: rgba(0, 170, 255, 0.1); }
  100% { background: transparent; }
}
</style>
