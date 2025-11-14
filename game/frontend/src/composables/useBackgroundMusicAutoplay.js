import { ref } from 'vue';

/**
 * Versión alternativa que intenta autoplay más agresivamente
 * usando el truco de iniciar silenciado y luego activar el volumen
 */
export function useBackgroundMusicAutoplay(audioSrc, options = {}) {
  const {
    volume = 0.3,
    loop = true,
    autoplay = true
  } = options;

  const audio = ref(null);
  const isPlaying = ref(false);
  const isMuted = ref(false);
  let hasInteracted = false;

  const init = () => {
    audio.value = new Audio(audioSrc);
    audio.value.loop = loop;
    audio.value.preload = 'auto';
    
    // Configuración para loop sin cortes
    audio.value.addEventListener('ended', () => {
      if (loop) {
        audio.value.currentTime = 0;
        audio.value.play().catch(err => console.log('Error en loop:', err));
      }
    });
    
    if (autoplay) {
      // Truco: Iniciar silenciado (permitido por navegadores)
      audio.value.muted = true;
      audio.value.volume = 0;
      
      audio.value.play()
        .then(() => {
          console.log('🎵 Audio iniciado (silenciado)');
          isPlaying.value = true;
          
          // Esperar interacción para activar el volumen
          const enableSound = () => {
            if (!hasInteracted) {
              hasInteracted = true;
              audio.value.muted = false;
              audio.value.volume = volume;
              console.log('🔊 Volumen activado');
              
              document.removeEventListener('click', enableSound);
              document.removeEventListener('keydown', enableSound);
              document.removeEventListener('touchstart', enableSound);
            }
          };
          
          document.addEventListener('click', enableSound, { once: true });
          document.addEventListener('keydown', enableSound, { once: true });
          document.addEventListener('touchstart', enableSound, { once: true });
        })
        .catch(error => {
          console.log('⏸️ Esperando interacción del usuario...');
          waitForUserInteraction();
        });
    }
  };

  const waitForUserInteraction = () => {
    const startOnInteraction = () => {
      audio.value.muted = false;
      audio.value.volume = volume;
      play();
      
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
          console.log('Error al reproducir:', error);
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
