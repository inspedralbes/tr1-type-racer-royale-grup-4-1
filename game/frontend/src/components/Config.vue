<template>
  <div>
    <button
      class="btn-icon config-trigger"
      aria-label="Configuración"
      @click="gameStore.playClickSound(); isOpen = true"
    >
      <i class="fa-solid fa-gear"></i>
    </button>
 
    <div v-if="isOpen" class="modal-overlay" @click="gameStore.playClickSound(); isOpen = false">
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
            <img :src="profileImage" alt="Usuari" />
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

// Imagen por defecto - apunta a la imagen default.png del backend
const defaultImage = "http://localhost:3000/img/default.png";

const profileImage = ref(defaultImage);

// Obtener userId del Pinia store
const userId = computed(() => gameStore.userId);

onMounted(() => {
  loadUserProfile();
  // Cargar modo oscuro
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  isDarkMode.value = savedDarkMode;
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
  }
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
  localStorage.setItem('darkMode', isDarkMode.value.toString());
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
    showMessage('La imatge no ha de superar 5MB', 'error');
    return;
  }

  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showMessage('Només es permeten imatges (jpg, png, gif, webp)', 'error');
    return;
  }

  if (!userId.value) {
    showMessage('Has d\'iniciar sessió per canviar la teva foto', 'error');
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
      showMessage('✅ Foto actualitzada correctament', 'success');
      console.log('Nueva ruta de imagen:', profileImage.value);
      
      // Notificar al servidor via socket para actualizar la imagen en el lobby
      if (gameStore.manager && userId.value) {
        gameStore.manager.emit('updateProfileImage', userId.value);
        console.log('Evento updateProfileImage emitido al servidor');
      }
    } else {
      showMessage('❌ ' + (data.message || 'Error en pujar la imatge'), 'error');
      console.error('Error en la respuesta:', data);
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
      showMessage('❌ Error de connexió en pujar la imatge', 'error');
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
  position: fixed;
  bottom: var(--layout-fab-bottom);
  right: var(--layout-fab-horizontal);
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.config-trigger i {
  font-size: 1.5rem;
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
  background: var(--bg-loading);
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