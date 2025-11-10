import { ref, onMounted, onUnmounted } from 'vue';

export function useBackgroundMusic(audioSrc, options = {}) {
  const {
    volume = 0.3,
    loop = true,
    autoplay = true
  } = options;

  const audio = ref(null);
  const isPlaying = ref(false);
  const isMuted = ref(false);
  let userInteractionListener = null;

  const init = () => {
    audio.value = new Audio(audioSrc);
    audio.value.loop = loop;
    audio.value.volume = volume;
    
    // Precargar el audio para evitar cortes
    audio.value.preload = 'auto';
    
    // Configuración para loop sin cortes
    audio.value.addEventListener('ended', () => {
      if (loop) {
        audio.value.currentTime = 0;
        audio.value.play().catch(err => console.log('Error en loop:', err));
      }
    });
    
    // Evitar pausas al cambiar de pestaña
    audio.value.addEventListener('pause', (e) => {
      if (isPlaying.value && !e.target.paused) {
        audio.value.play().catch(err => console.log('Error al reanudar:', err));
      }
    });
    
    if (autoplay) {
      // Intentar reproducir inmediatamente
      play().catch(() => {
        // Si falla, esperar a la primera interacción del usuario
        waitForUserInteraction();
      });
    }
  };

  const waitForUserInteraction = () => {
    const startOnInteraction = () => {
      play();
      // Remover los listeners después de la primera interacción
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };

    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('keydown', startOnInteraction, { once: true });
    document.addEventListener('touchstart', startOnInteraction, { once: true });
  };

  const play = () => {
    if (audio.value) {
      return audio.value.play()
        .then(() => {
          isPlaying.value = true;
        })
        .catch(error => {
          console.log('Esperando interacción del usuario para reproducir audio...');
          throw error;
        });
    }
    return Promise.reject('Audio no inicializado');
  };

  const pause = () => {
    if (audio.value) {
      audio.value.pause();
      isPlaying.value = false;
    }
  };

  const togglePlay = () => {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    if (audio.value) {
      audio.value.muted = !audio.value.muted;
      isMuted.value = audio.value.muted;
    }
  };

  const setVolume = (newVolume) => {
    if (audio.value) {
      audio.value.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  const cleanup = () => {
    if (audio.value) {
      audio.value.pause();
      audio.value = null;
    }
  };

  return {
    audio,
    isPlaying,
    isMuted,
    init,
    play,
    pause,
    togglePlay,
    toggleMute,
    setVolume,
    cleanup
  };
}
