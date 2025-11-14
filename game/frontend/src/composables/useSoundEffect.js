import { ref } from 'vue';

/**
 * Composable para reproducir efectos de sonido
 */
export function useSoundEffect(audioSrc, options = {}) {
  const {
    volume = 0.5
  } = options;

  const audio = ref(null);

  const init = () => {
    audio.value = new Audio(audioSrc);
    audio.value.volume = volume;
    audio.value.preload = 'auto';
  };

  const play = () => {
    if (audio.value) {
      // Reiniciar el audio si ya está reproduciéndose
      audio.value.currentTime = 0;
      audio.value.play().catch(err => console.log('Error al reproducir sonido:', err));
    }
  };

  const setVolume = (newVolume) => {
    if (audio.value) {
      audio.value.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    init,
    play,
    setVolume
  };
}
