import { ref } from 'vue';

// Estado global compartido para todas las alertas
const alerts = ref([]);

export function useGameAlert() {
  const showAlert = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const alert = {
      id,
      message,
      type,
      duration
    };
    
    alerts.value.push(alert);
    
    // Auto-remove después de la duración
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
    
    return id;
  };

  const removeAlert = (id) => {
    const index = alerts.value.findIndex(a => a.id === id);
    if (index > -1) {
      alerts.value.splice(index, 1);
    }
  };

  const showError = (message, duration = 5000) => {
    return showAlert(message, 'error', duration);
  };

  const showWarning = (message, duration = 4000) => {
    return showAlert(message, 'warning', duration);
  };

  const showInfo = (message, duration = 4000) => {
    return showAlert(message, 'info', duration);
  };

  const showSuccess = (message, duration = 3000) => {
    return showAlert(message, 'success', duration);
  };

  return {
    alerts,
    showAlert,
    removeAlert,
    showError,
    showWarning,
    showInfo,
    showSuccess
  };
}

