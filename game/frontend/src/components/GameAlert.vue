<template>
  <Transition name="alert-fade">
    <div v-if="visible" :class="['game-alert', `game-alert--${type}`]" :style="alertStyle">
      <div class="game-alert-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="game-alert-content">
        <p class="game-alert-message">{{ message }}</p>
      </div>
      <button 
        v-if="dismissible" 
        class="game-alert-close" 
        @click="dismiss"
        aria-label="Tancar"
      >
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['error', 'warning', 'info', 'success'].includes(value)
  },
  duration: {
    type: Number,
    default: 4000 // 4 segundos por defecto
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  index: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['dismiss']);

const visible = ref(false);
let timeoutId = null;

const iconClass = {
  error: 'fa-solid fa-exclamation-circle',
  warning: 'fa-solid fa-exclamation-triangle',
  info: 'fa-solid fa-info-circle',
  success: 'fa-solid fa-check-circle'
}[props.type];

const alertStyle = computed(() => {
  // Espaciado vertical para múltiples alertas
  const topOffset = 20 + (props.index * 90); // 90px de altura aproximada por alerta
  return {
    top: `${topOffset}px`
  };
});

const show = () => {
  visible.value = true;
  
  // Limpiar timeout anterior si existe
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // Auto-dismiss después de la duración especificada
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      dismiss();
    }, props.duration);
  }
};

const dismiss = () => {
  visible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  emit('dismiss');
};

onMounted(() => {
  show();
});

watch(() => props.message, () => {
  if (props.message) {
    show();
  }
});

defineExpose({
  show,
  dismiss
});
</script>

<style scoped>
.game-alert {
  position: absolute;
  left: var(--spacing-lg);
  min-width: 320px;
  max-width: 480px;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  animation: slideInLeft 0.3s ease-out;
}

.game-alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-size: 1.4rem;
}

.game-alert-content {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 32px;
}

.game-alert-message {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-primary);
  font-family: 'Poppins', sans-serif;
}

.game-alert-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-round);
  transition: background var(--transition-base), transform var(--transition-base);
  flex-shrink: 0;
  margin-top: 2px;
}

.game-alert-close:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.game-alert-close:active {
  transform: scale(0.95);
}

/* Tipos de alerta */
.game-alert--error {
  border-color: var(--color-danger);
  background: color-mix(in srgb, var(--bg-card) 95%, var(--color-danger) 5%);
}

.game-alert--error .game-alert-icon {
  color: var(--color-danger);
}

.game-alert--warning {
  border-color: var(--color-warning);
  background: color-mix(in srgb, var(--bg-card) 95%, var(--color-warning) 5%);
}

.game-alert--warning .game-alert-icon {
  color: var(--color-warning);
}

.game-alert--info {
  border-color: var(--color-info);
  background: color-mix(in srgb, var(--bg-card) 95%, var(--color-info) 5%);
}

.game-alert--info .game-alert-icon {
  color: var(--color-info);
}

.game-alert--success {
  border-color: var(--color-success);
  background: color-mix(in srgb, var(--bg-card) 95%, var(--color-success) 5%);
}

.game-alert--success .game-alert-icon {
  color: var(--color-success);
}

/* Animaciones */
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* Responsive */
@media (max-width: 768px) {
  .game-alert {
    top: var(--spacing-md);
    left: var(--spacing-md);
    right: var(--spacing-md);
    min-width: auto;
    max-width: none;
  }
}
</style>

