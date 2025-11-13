<template>
  <div>
    <button
      class="btn-icon config-trigger"
      aria-label="Configuración"
      @click="gameStore.playClickSound(); isOpen = true"
    >
      <i class="fa-solid fa-gear"></i>
    </button>
 
    <div v-if="isOpen" class="modal-overlay" @click="isOpen = false">
      <div class="modal-card config-modal" @click.stop>
        <button class="btn-icon btn-icon--ghost close-button" @click="gameStore.playClickSound(); isOpen = false">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="modal-header">
          <h3 class="modal-heading">Configuració d'usuari</h3>
          <p class="modal-subheading">Actualitza la teva credencial i ajusta l'experiència de la redacció.</p>
        </div>

        <div class="profile-block badge-surface" @click="gameStore.playClickSound(); openFileSelector()">
          <div class="profile-image">
            <img :src="profileImage" alt="Usuario" />
          </div>
          <div class="profile-cta">
            <span class="tag">
              <i class="fa-solid fa-camera"></i>
              Actualitzar foto
            </span>
            <span class="profile-name" :title="username || 'Jugador'">{{ username || 'Jugador' }}</span>
          </div>

          <div v-if="isUploading" class="profile-loading">
            <span class="spinner"></span>
            <span>Pujant imatge...</span>
          </div>
        </div>

        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style="display: none"
        />

        <Transition name="fade">
          <div v-if="uploadMessage" :class="['toast', uploadMessageClass]">
            {{ uploadMessage }}
          </div>
        </Transition>

        <div class="stats-grid">
          <div class="stats-card surface-floating">
            <span class="stats-label">Partides guanyades</span>
            <span class="stats-value">0</span>
          </div>
          <div class="stats-card surface-floating">
            <span class="stats-label">Millor marca</span>
            <span class="stats-value">0</span>
          </div>
        </div>

        <hr class="modal-divider" />

        <div class="settings-group">
          <h3 class="modal-heading">Ajustos de joc</h3>

          <div class="control-row">
            <label for="volume-control">Volum principal</label>
            <div class="slider-wrapper">
              <input id="volume-control" type="range" v-model="volume" @input="changeVolume" min="0" max="100" />
              <span class="slider-value">{{ volume }}%</span>
            </div>
          </div>

          <label class="toggle-row">
            <input
              type="checkbox"
              v-model="isDarkMode"
              @change="toggleDarkMode"
            />
            Mode nocturn
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

const isOpen = ref(false);
const isDarkMode = ref(false);
const volume = ref(gameStore.musicVolume);
const fileInput = ref(null);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

const uploadMessageClass = computed(() => {
  return uploadMessageType.value === 'error' ? 'toast--error' : 'toast--success';
});

// Obtener username del Pinia store
const username = computed(() => gameStore.username || 'Jugador');

// Imagen por defecto
const defaultImage = "data:image/png;base64,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";

const profileImage = ref(defaultImage);

// Obtener userId del Pinia store
const userId = computed(() => gameStore.userId);

onMounted(() => {
  loadUserProfile();
});

// Watch para recargar la imagen cuando cambie el userId
watch(userId, (newUserId) => {
  console.log('UserId cambió a:', newUserId);
  if (newUserId) {
    profileImage.value = defaultImage; // Reset a imagen por defecto
    loadUserProfile();
  }
});

const loadUserProfile = () => {
  if (userId.value) {
    console.log('Cargando perfil de usuario para userId:', userId.value);
    // Cargar la información del usuario desde el servidor
    fetch(`http://localhost:3000/api/get-user-info/${userId.value}`)
      .then(response => response.json())
      .then(data => {
        console.log('Respuesta del servidor:', data);
        if (data.ok) {
          // Actualizar username si viene del servidor
          if (data.username) {
            gameStore.setUsername(data.username);
          }
          // Construir la URL completa de la imagen si existe
          if (data.imagePath) {
            profileImage.value = `http://localhost:3000${data.imagePath}`;
            console.log('Imagen de perfil cargada:', profileImage.value);
          }
        }
      })
      .catch(error => {
        console.error('Error al cargar perfil de usuario:', error);
      });
  }
};

const toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode', isDarkMode.value);
};

const changeVolume = () => {
  gameStore.setMusicVolume(volume.value);
  console.log('Volumen cambiado a:', volume.value);
};

const openFileSelector = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showMessage('La imagen no debe superar 5MB', 'error');
    return;
  }

  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showMessage('Solo se permiten imágenes (jpg, png, gif, webp)', 'error');
    return;
  }

  if (!userId.value) {
    showMessage('Debes iniciar sesión para cambiar tu foto', 'error');
    return;
  }

  await uploadImage(file);
};

const uploadImage = async (file) => {
  isUploading.value = true;
  uploadMessage.value = '';

  console.log('Iniciando subida de imagen...');

  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId.value);

    console.log('Enviando FormData al servidor...');

    const response = await fetch('http://localhost:3000/api/upload-profile-image', {  
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Respuesta del servidor:', data);

    if (data.ok) {
      // Construir la URL completa de la imagen
      profileImage.value = `http://localhost:3000${data.imagePath}`;
      showMessage('✅ Foto actualizada correctamente', 'success');
      console.log('Nueva ruta de imagen:', profileImage.value);
      
      // Notificar al servidor via socket para actualizar la imagen en el lobby
      if (gameStore.manager && userId.value) {
        gameStore.manager.emit('updateProfileImage', userId.value);
        console.log('Evento updateProfileImage emitido al servidor');
      }
    } else {
      showMessage('❌ ' + (data.message || 'Error al subir la imagen'), 'error');
      console.error('Error en la respuesta:', data);
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    showMessage('❌ Error de conexión al subir la imagen', 'error');
  } finally {
    isUploading.value = false;
    // Limpiar el input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const showMessage = (message, type) => {
  uploadMessage.value = message;
  uploadMessageType.value = type;
  console.log(`[${type.toUpperCase()}] ${message}`);
  setTimeout(() => {
    uploadMessage.value = '';
  }, 4000);
};
</script>

<style scoped>
.config-trigger {
  position: absolute;
  bottom: 6vh;
  right: 5vw;
  box-shadow: var(--shadow-md);
}

.config-modal {
  position: relative;
  text-align: left;
  overflow: visible;
  width: min(460px, 92vw);
}

.close-button {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
}

.modal-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
}

.modal-subheading {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.profile-block {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.profile-block:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 38px rgba(91, 63, 27, 0.25);
}

.profile-image {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid color-mix(in srgb, var(--color-secondary) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-card) 70%, var(--color-secondary) 30%);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-cta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  font-weight: 600;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: capitalize;
}

.profile-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: rgba(245, 238, 219, 0.88);
  border-radius: inherit;
  backdrop-filter: blur(2px);
  color: var(--color-primary);
  font-weight: 700;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--color-secondary) 35%, transparent 65%);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin: var(--spacing-xl) 0 var(--spacing-lg);
}

.stats-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
}

.stats-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.08rem;
  font-weight: 600;
}

.stats-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-primary);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.control-row label {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  letter-spacing: 0.02rem;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.slider-wrapper input[type="range"] {
  flex: 1;
  accent-color: var(--color-secondary);
}

.slider-value {
  min-width: 3.5rem;
  text-align: right;
  font-weight: 700;
  color: var(--color-primary);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 700;
  color: var(--color-primary);
  user-select: none;
}

.toggle-row input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: var(--color-secondary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .config-trigger {
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
body.dark-mode {
  background: var(--color-night) !important;
  color: var(--text-white) !important;
}

body.dark-mode .config-modal {
  background: color-mix(in srgb, var(--color-night-card) 92%, transparent 8%) !important;
  color: var(--text-white) !important;
}

body.dark-mode .modal-heading {
  color: var(--color-warning) !important;
}

body.dark-mode .stats-card {
  background: color-mix(in srgb, var(--color-night-card) 85%, transparent 15%) !important;
  border-color: color-mix(in srgb, var(--color-warning) 30%, transparent 70%) !important;
}

body.dark-mode .modal-divider {
  border-top-color: color-mix(in srgb, var(--color-warning) 55%, transparent 45%) !important;
}

body.dark-mode .toast {
  background: color-mix(in srgb, var(--color-night-card) 80%, transparent 20%) !important;
  color: var(--text-white) !important;
}
</style>